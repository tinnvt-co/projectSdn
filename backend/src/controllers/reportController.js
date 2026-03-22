const Building = require("../models/Building");
const Report = require("../models/Report");

const REPORT_POPULATE = [
    { path: "managerId", select: "username email" },
    { path: "buildingId", select: "name address" },
    { path: "adminReview.reviewedBy", select: "username email" },
];

const populateReportQuery = (query) => {
    REPORT_POPULATE.forEach((config) => query.populate(config));
    return query;
};

const isManagerOwner = (req, report) =>
    req.user?.role === "manager" &&
    String(report.managerId?._id || report.managerId) === String(req.user._id);

exports.getReports = async (req, res) => {
    try {
        const { status, type, managerId, buildingId } = req.query;
        const filter = {};

        if (status) filter.status = status;
        if (type) filter.type = type;
        if (buildingId) filter.buildingId = buildingId;

        if (req.user.role === "manager") {
            filter.managerId = req.user._id;
        } else if (managerId) {
            filter.managerId = managerId;
        }

        const reports = await populateReportQuery(
            Report.find(filter).sort({ createdAt: -1 })
        );

        return res.status(200).json({
            success: true,
            count: reports.length,
            reports,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Không thể tải danh sách báo cáo",
        });
    }
};

exports.getReportById = async (req, res) => {
    try {
        const report = await populateReportQuery(Report.findById(req.params.id));

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy báo cáo",
            });
        }

        if (req.user.role === "manager" && !isManagerOwner(req, report)) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền xem báo cáo này",
            });
        }

        return res.status(200).json({
            success: true,
            report,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Không thể tải chi tiết báo cáo",
        });
    }
};

exports.createReport = async (req, res) => {
    try {
        const { title, content, type = "general", buildingId, attachments = [] } = req.body;

        if (!title?.trim() || !content?.trim() || !buildingId) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng nhập đầy đủ tiêu đề, nội dung và tòa nhà",
            });
        }

        const building = await Building.findById(buildingId).select("managerId name");
        if (!building) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tòa nhà được chọn",
            });
        }

        if (req.user.role === "manager" && String(building.managerId) !== String(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: "Bạn chỉ có thể gửi báo cáo cho tòa nhà mình phụ trách",
            });
        }

        const report = await Report.create({
            title: title.trim(),
            content: content.trim(),
            type,
            attachments,
            buildingId,
            managerId: req.user._id,
            status: "pending",
        });

        const savedReport = await populateReportQuery(Report.findById(report._id));

        return res.status(201).json({
            success: true,
            message: "Gửi báo cáo thành công",
            report: savedReport,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Không thể tạo báo cáo",
        });
    }
};

exports.reviewReport = async (req, res) => {
    try {
        const { note = "" } = req.body;

        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy báo cáo",
            });
        }

        report.status = "reviewed";
        report.adminReview = {
            reviewedBy: req.user._id,
            note: note.trim(),
            reviewedAt: new Date(),
        };

        await report.save();

        const updatedReport = await populateReportQuery(Report.findById(report._id));

        return res.status(200).json({
            success: true,
            message: "Đã duyệt báo cáo",
            report: updatedReport,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Không thể duyệt báo cáo",
        });
    }
};

exports.deleteReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy báo cáo",
            });
        }

        if (!isManagerOwner(req, report)) {
            return res.status(403).json({
                success: false,
                message: "Bạn không có quyền xóa báo cáo này",
            });
        }

        if (report.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Chỉ có thể xóa báo cáo đang chờ duyệt",
            });
        }

        await Report.findByIdAndDelete(report._id);

        return res.status(200).json({
            success: true,
            message: "Đã xóa báo cáo",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Không thể xóa báo cáo",
        });
    }
};

exports.getMyBuildings = async (req, res) => {
    try {
        const buildings = await Building.find({ managerId: req.user._id })
            .select("name address status totalFloors")
            .sort({ name: 1 });

        return res.status(200).json({
            success: true,
            count: buildings.length,
            buildings,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Không thể tải danh sách tòa nhà phụ trách",
        });
    }
};
