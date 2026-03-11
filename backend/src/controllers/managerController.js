const Request = require("../models/Request");
const Student = require("../models/Student");
const RoomRegistration = require("../models/RoomRegistration");
const RoomAssignment = require("../models/RoomAssignment");
const Room = require("../models/Room");

const getCurrentTermCode = (date = new Date()) => {
    const month = date.getMonth() + 1;
    return `HK${month < 6 ? 1 : 2}-${date.getFullYear()}`;
};

const calcRoomStatus = (room) => {
    if (room.status === "maintenance") return "maintenance";
    if (room.currentOccupancy >= room.maxOccupancy) return "full";
    if (room.currentOccupancy > 0) return "partial";
    return "available";
};

const increaseRoomOccupancy = async (roomId) => {
    const room = await Room.findById(roomId);
    if (!room || !room.isActive) throw new Error("Phòng dích không t?n t?i ho?c dã ng?ng ho?t d?ng");
    if (!(["available", "partial"].includes(room.status)) || room.currentOccupancy >= room.maxOccupancy)
        throw new Error("Phòng dích dã d?y ho?c không kh? d?ng");

    room.currentOccupancy += 1;
    room.status = calcRoomStatus(room);
    await room.save();
    return room;
};

const decreaseRoomOccupancy = async (roomId) => {
    if (!roomId) return;
    const room = await Room.findById(roomId);
    if (!room) return;

    room.currentOccupancy = Math.max(0, room.currentOccupancy - 1);
    room.status = calcRoomStatus(room);
    await room.save();
};

// GET /api/manager/requests
exports.getRequests = async (req, res) => {
    try {
        const { type, status } = req.query;
        const filter = {};
        if (type) filter.type = type;
        if (status) filter.status = status;

        const requests = await Request.find(filter)
            .sort({ createdAt: -1 })
            .populate({
                path: "studentId",
                select: "fullName studentCode",
                populate: { path: "userId", select: "username email" },
            })
            .populate({
                path: "currentRoomId",
                select: "roomNumber floor buildingId",
                populate: { path: "buildingId", select: "name" },
            })
            .populate({
                path: "targetRoomId",
                select: "roomNumber floor buildingId",
                populate: { path: "buildingId", select: "name" },
            });

        res.json({ success: true, count: requests.length, data: requests });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/manager/requests/:id
exports.reviewRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, note } = req.body;

        if (!["approve", "reject"].includes(action))
            return res.status(400).json({ success: false, message: "action ph?i là approve ho?c reject" });

        const request = await Request.findById(id);
        if (!request)
            return res.status(404).json({ success: false, message: "Không tìm th?y yêu c?u" });
        if (request.status !== "pending")
            return res.status(400).json({ success: false, message: "Yêu c?u dã du?c x? lý" });

        request.status = action === "approve" ? "manager_approved" : "manager_rejected";
        request.managerReview = {
            reviewedBy: req.user._id,
            status: action === "approve" ? "approved" : "rejected",
            note: note || "",
            reviewedAt: new Date(),
        };

        if (action === "approve" && request.type === "room_transfer") {
            if (!request.targetRoomId)
                return res.status(400).json({ success: false, message: "Yêu c?u chuy?n phòng chua có phòng dích" });

            const student = await Student.findById(request.studentId);
            if (!student)
                return res.status(404).json({ success: false, message: "Không tìm th?y sinh viên" });
            if (!student.currentRoomId)
                return res.status(400).json({ success: false, message: "Sinh viên chua có phòng hi?n t?i d? chuy?n" });
            if (String(student.currentRoomId) === String(request.targetRoomId))
                return res.status(400).json({ success: false, message: "Phòng dích trùng v?i phòng hi?n t?i" });

            const targetRoom = await increaseRoomOccupancy(request.targetRoomId);
            await decreaseRoomOccupancy(student.currentRoomId);

            await RoomAssignment.updateMany(
                { studentId: student._id, status: "active" },
                { $set: { status: "ended", endDate: new Date() } }
            );

            const termCode = getCurrentTermCode();
            await RoomAssignment.create({
                studentId: student._id,
                roomId: targetRoom._id,
                buildingId: targetRoom.buildingId,
                termCode,
                startDate: new Date(),
                status: "active",
            });

            await RoomRegistration.create({
                studentId: student._id,
                roomId: targetRoom._id,
                termCode,
                status: "approved",
                reviewedBy: req.user._id,
                reviewedAt: new Date(),
                reviewNote: `Manager duy?t chuy?n phòng t? yêu c?u #${id}`,
            });

            student.currentRoomId = targetRoom._id;
            await student.save();

            request.status = "completed";
            request.managerReview.note = (note ? `${note}. ` : "") + "Ðã chuy?n phòng thành công";
        }

        await request.save();
        res.json({ success: true, message: `Ðã ${action === "approve" ? "duy?t" : "t? ch?i"} yêu c?u`, data: request });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// PUT /api/manager/requests/:id/approve-retention
exports.approveRetention = async (req, res) => {
    try {
        const { id } = req.params;
        const { nextTermCode } = req.body;

        if (!nextTermCode)
            return res.status(400).json({ success: false, message: "nextTermCode là b?t bu?c" });

        const request = await Request.findById(id).populate("studentId");
        if (!request) return res.status(404).json({ success: false, message: "Không tìm th?y yêu c?u" });
        if (request.type !== "room_retention")
            return res.status(400).json({ success: false, message: "Không ph?i yêu c?u gi? phòng" });
        if (request.status !== "pending")
            return res.status(400).json({ success: false, message: "Yêu c?u dã du?c x? lý" });

        const student = await Student.findById(request.studentId);
        if (!student?.currentRoomId)
            return res.status(400).json({ success: false, message: "Sinh viên chua có phòng hi?n t?i" });

        const existing = await RoomRegistration.findOne({ studentId: student._id, termCode: nextTermCode });
        if (existing)
            return res.status(400).json({ success: false, message: "Sinh viên dã có dang ký cho k? này" });

        const booking = await RoomRegistration.create({
            studentId: student._id,
            roomId: student.currentRoomId,
            termCode: nextTermCode,
            status: "approved",
            reviewedBy: req.user._id,
            reviewedAt: new Date(),
            reviewNote: `Duy?t gi? phòng t? yêu c?u #${id}`,
        });

        request.status = "completed";
        request.managerReview = {
            reviewedBy: req.user._id,
            status: "approved",
            note: `Ðã t?o dang ký gi? phòng k? ${nextTermCode}`,
            reviewedAt: new Date(),
        };
        await request.save();

        res.json({ success: true, message: `Ðã duy?t gi? phòng k? ${nextTermCode}`, data: { booking, request } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

