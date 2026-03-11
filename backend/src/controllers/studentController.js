const Student = require("../models/Student");
const Notification = require("../models/Notification");
const RoomAssignment = require("../models/RoomAssignment");
const RoomRegistration = require("../models/RoomRegistration");
const ElectricityUsage = require("../models/ElectricityUsage");
const Payment = require("../models/Payment");
const Request = require("../models/Request");
const ViolationRecord = require("../models/ViolationRecord");
const Room = require("../models/Room");
const Setting = require("../models/Setting");

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
    if (!room || !room.isActive) throw new Error("Phòng không t?n t?i ho?c dã ng?ng ho?t d?ng");
    if (!(["available", "partial"].includes(room.status)) || room.currentOccupancy >= room.maxOccupancy)
        throw new Error("Phòng dã d?y ho?c không kh? d?ng");

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

// Helper: l?y Student t? userId, t? t?o n?u chua có
const getStudent = async (user) => {
    let student = await Student.findOne({ userId: user._id });
    if (!student) {
        student = await Student.create({
            userId: user._id,
            studentCode: user.username,
            fullName: user.username,
            gender: "male",
            dateOfBirth: new Date("2000-01-01"),
            identityNumber: user._id.toString().slice(-9),
            faculty: "Chua c?p nh?t",
            major: "Chua c?p nh?t",
            classCode: "Chua c?p nh?t",
            academicYear: new Date().getFullYear().toString(),
        });
    }
    return student;
};

// GET /student/profile
exports.getMyProfile = async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user._id })
            .populate("userId", "username email phone")
            .populate({
                path: "currentRoomId",
                select: "roomNumber floor buildingId",
                populate: { path: "buildingId", select: "name address" },
            });

        if (!student) return res.status(404).json({ success: false, message: "Chua có h? so sinh viên" });
        res.json({ success: true, data: student });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /student/news
exports.getNews = async (req, res) => {
    try {
        const notifications = await Notification.find({
            $or: [
                { receiverType: "role", targetRole: { $in: ["all", "student"] } },
                { receiverType: "individual", receiverIds: req.user._id },
            ],
        })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate("senderId", "username");

        res.json({ success: true, data: notifications });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /student/room-history
exports.getRoomHistory = async (req, res) => {
    try {
        const student = await getStudent(req.user);
        const assignments = await RoomAssignment.find({ studentId: student._id })
            .sort({ startDate: -1 })
            .populate({
                path: "roomId",
                select: "roomNumber floor type pricePerTerm buildingId",
                populate: { path: "buildingId", select: "name address" },
            });

        res.json({ success: true, data: assignments });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /student/bookings
exports.getBookings = async (req, res) => {
    try {
        const student = await getStudent(req.user);
        const bookings = await RoomRegistration.find({ studentId: student._id })
            .sort({ createdAt: -1 })
            .populate({
                path: "roomId",
                select: "roomNumber floor type maxOccupancy currentOccupancy buildingId",
                populate: { path: "buildingId", select: "name" },
            })
            .populate("reviewedBy", "username");

        res.json({ success: true, data: bookings });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /student/bookings
exports.createBooking = async (req, res) => {
    try {
        const regSetting = await Setting.findOne({ key: "room_registration_open" }).lean();
        const isOpen = regSetting ? Boolean(regSetting.value) : true;
        if (!isOpen)
            return res.status(403).json({ success: false, message: "Ban qu?n lý hi?n dang t?m d?ng nh?n don dang ký phòng. Vui lòng th? l?i sau." });

        const student = await getStudent(req.user);
        const { roomId, termCode, note } = req.body;
        if (!roomId || !termCode)
            return res.status(400).json({ success: false, message: "roomId và termCode là b?t bu?c" });

        const currentTerm = getCurrentTermCode();
        const hasCurrentRoom = Boolean(student.currentRoomId);
        const activeAssignmentThisTerm = await RoomAssignment.findOne({
            studentId: student._id,
            status: "active",
            termCode: currentTerm,
        });

        if (hasCurrentRoom || activeAssignmentThisTerm) {
            return res.status(400).json({
                success: false,
                message: "B?n dang có phòng ? k? hi?n t?i, không th? dang ký phòng m?i. N?u mu?n d?i phòng, vui lòng g?i yêu c?u chuy?n phòng.",
            });
        }

        const existing = await RoomRegistration.findOne({
            studentId: student._id,
            termCode,
            status: { $in: ["pending", "approved"] },
        });
        if (existing)
            return res.status(400).json({ success: false, message: "B?n dã có dang ký phòng cho k? này" });

        const room = await increaseRoomOccupancy(roomId);

        if (student.currentRoomId && String(student.currentRoomId) !== String(room._id)) {
            await decreaseRoomOccupancy(student.currentRoomId);
        }

        await RoomAssignment.updateMany(
            { studentId: student._id, status: "active" },
            { $set: { status: "ended", endDate: new Date() } }
        );

        const assignment = await RoomAssignment.create({
            studentId: student._id,
            roomId: room._id,
            buildingId: room.buildingId,
            termCode,
            startDate: new Date(),
            status: "active",
        });

        student.currentRoomId = room._id;
        await student.save();

        const booking = await RoomRegistration.create({
            studentId: student._id,
            roomId: room._id,
            termCode,
            note,
            status: "approved",
            reviewedBy: req.user._id,
            reviewedAt: new Date(),
            reviewNote: "H? th?ng t? duy?t do phòng còn ch? tr?ng",
        });

        res.status(201).json({
            success: true,
            message: "Ðang ký phòng thành công và dã du?c x?p phòng ngay",
            data: { booking, assignment },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /student/electricity
exports.getElectricity = async (req, res) => {
    try {
        const student = await getStudent(req.user);
        if (!student.currentRoomId)
            return res.json({ success: true, data: [], message: "Chua có phòng hi?n t?i" });

        const records = await ElectricityUsage.find({ roomId: student.currentRoomId })
            .sort({ year: -1, month: -1 })
            .limit(12);
        res.json({ success: true, data: records });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /student/payments
exports.getPayments = async (req, res) => {
    try {
        const student = await getStudent(req.user);
        const payments = await Payment.find({ studentId: student._id })
            .sort({ paidAt: -1 })
            .populate("invoiceId", "type totalAmount dueDate status");
        res.json({ success: true, data: payments });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /student/requests
exports.getMyRequests = async (req, res) => {
    try {
        const student = await getStudent(req.user);
        const requests = await Request.find({ studentId: student._id })
            .sort({ createdAt: -1 })
            .populate("currentRoomId", "roomNumber floor buildingId")
            .populate("targetRoomId", "roomNumber floor buildingId");

        res.json({ success: true, data: requests });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /student/requests
exports.createRequest = async (req, res) => {
    try {
        const student = await getStudent(req.user);
        const { type, title, description, targetRoomId } = req.body;
        if (!type || !title || !description)
            return res.status(400).json({ success: false, message: "type, title, description là b?t bu?c" });

        if (type === "room_transfer") {
            if (!student.currentRoomId)
                return res.status(400).json({ success: false, message: "B?n chua có phòng hi?n t?i d? g?i yêu c?u chuy?n phòng" });
            if (!targetRoomId)
                return res.status(400).json({ success: false, message: "Vui lòng ch?n phòng mu?n chuy?n d?n" });
            if (String(targetRoomId) === String(student.currentRoomId))
                return res.status(400).json({ success: false, message: "Phòng chuy?n d?n ph?i khác phòng hi?n t?i" });

            const targetRoom = await Room.findById(targetRoomId);
            if (!targetRoom || !targetRoom.isActive)
                return res.status(404).json({ success: false, message: "Không tìm th?y phòng mu?n chuy?n" });
            if (!(["available", "partial"].includes(targetRoom.status)) || targetRoom.currentOccupancy >= targetRoom.maxOccupancy)
                return res.status(400).json({ success: false, message: "Phòng mu?n chuy?n dã h?t ch?" });

            const pendingTransfer = await Request.findOne({
                studentId: student._id,
                type: "room_transfer",
                status: "pending",
            });
            if (pendingTransfer)
                return res.status(400).json({ success: false, message: "B?n dang có yêu c?u chuy?n phòng ch? duy?t" });
        }

        const request = await Request.create({
            studentId: student._id,
            type,
            title,
            description,
            currentRoomId: student.currentRoomId,
            targetRoomId: type === "room_transfer" ? targetRoomId : null,
        });

        res.status(201).json({ success: true, message: "T?o yêu c?u thành công", data: request });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /student/violations
exports.getViolations = async (req, res) => {
    try {
        const student = await getStudent(req.user);
        const violations = await ViolationRecord.find({ studentId: student._id })
            .sort({ createdAt: -1 })
            .populate("roomId", "roomNumber building floor")
            .populate("reportedBy", "username");

        res.json({ success: true, data: violations });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// GET /student/rooms/available
exports.getAvailableRooms = async (req, res) => {
    try {
        const { type, building } = req.query;
        const filter = {
            isActive: true,
            status: { $in: ["available", "partial"] },
        };
        if (type) filter.type = type;

        const rooms = await Room.find(filter)
            .populate("buildingId", "name address")
            .sort({ "buildingId": 1, floor: 1, roomNumber: 1 });

        const result = building
            ? rooms.filter((r) => r.buildingId?.name?.toLowerCase().includes(building.toLowerCase()))
            : rooms;

        res.json({ success: true, data: result });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// POST /student/requests/:id/approve-retention
exports.approveRetentionRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { nextTermCode } = req.body;

        if (!nextTermCode)
            return res.status(400).json({ success: false, message: "nextTermCode là b?t bu?c" });

        const request = await Request.findById(id);
        if (!request)
            return res.status(404).json({ success: false, message: "Không tìm th?y yêu c?u" });
        if (request.type !== "room_retention")
            return res.status(400).json({ success: false, message: "Yêu c?u này không ph?i xin gi? phòng" });
        if (request.status !== "pending")
            return res.status(400).json({ success: false, message: "Yêu c?u dã du?c x? lý" });

        const student = await Student.findById(request.studentId);
        if (!student?.currentRoomId)
            return res.status(400).json({ success: false, message: "Sinh viên chua có phòng hi?n t?i" });

        const existing = await RoomRegistration.findOne({
            studentId: student._id,
            termCode: nextTermCode,
        });
        if (existing)
            return res.status(400).json({ success: false, message: "Sinh viên dã có don dang ký cho k? này" });

        const booking = await RoomRegistration.create({
            studentId: student._id,
            roomId: student.currentRoomId,
            termCode: nextTermCode,
            status: "approved",
            reviewedBy: req.user._id,
            reviewedAt: new Date(),
            reviewNote: `Ðu?c duy?t gi? phòng t? yêu c?u #${id}`,
        });

        request.status = "completed";
        request.managerReview = {
            reviewedBy: req.user._id,
            status: "approved",
            note: `Ðã t?o dang ký phòng cho k? ${nextTermCode}`,
            reviewedAt: new Date(),
        };
        await request.save();

        res.json({
            success: true,
            message: `Ðã duy?t gi? phòng và t?o dang ký cho k? ${nextTermCode}`,
            data: { booking, request },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


