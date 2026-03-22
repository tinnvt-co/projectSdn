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
            message: error.message || "Khong the tai danh sach bao cao",
        });
    }
};

exports.getReportById = async (req, res) => {
    try {
        const report = await populateReportQuery(Report.findById(req.params.id));

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Khong tim thay bao cao",
            });
        }

        if (req.user.role === "manager" && !isManagerOwner(req, report)) {
            return res.status(403).json({
                success: false,
                message: "Ban khong co quyen xem bao cao nay",
            });
        }

        return res.status(200).json({
            success: true,
            report,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Khong the tai chi tiet bao cao",
        });
    }
};

exports.createReport = async (req, res) => {
    try {
        const { title, content, type = "general", buildingId, attachments = [] } = req.body;

        if (!title?.trim() || !content?.trim() || !buildingId) {
            return res.status(400).json({
                success: false,
                message: "Vui long nhap day du tieu de, noi dung va toa nha",
            });
        }

        const building = await Building.findById(buildingId).select("managerId name");
        if (!building) {
            return res.status(404).json({
                success: false,
                message: "Khong tim thay toa nha duoc chon",
            });
        }

        if (req.user.role === "manager" && String(building.managerId) !== String(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: "Ban chi co the gui bao cao cho toa nha minh phu trach",
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
            message: "Gui bao cao thanh cong",
            report: savedReport,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Khong the tao bao cao",
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
                message: "Khong tim thay bao cao",
            });
        }

        if (report.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Bao cao nay da duoc duyet truoc do",
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
            message: "Da duyet bao cao",
            report: updatedReport,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Khong the duyet bao cao",
        });
    }
};

exports.deleteReport = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({
                success: false,
                message: "Khong tim thay bao cao",
            });
        }

        if (!isManagerOwner(req, report)) {
            return res.status(403).json({
                success: false,
                message: "Ban khong co quyen xoa bao cao nay",
            });
        }

        if (report.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Chi co the xoa bao cao dang cho duyet",
            });
        }

        await Report.findByIdAndDelete(report._id);

        return res.status(200).json({
            success: true,
            message: "Da xoa bao cao",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Khong the xoa bao cao",
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
            message: error.message || "Khong the tai danh sach toa nha phu trach",
        });
    }
};
