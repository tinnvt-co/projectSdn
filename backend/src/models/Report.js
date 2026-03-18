const mongoose = require("mongoose");
// Mô hình dữ liệu cho báo cáo của quản lý
// Mỗi báo cáo sẽ thuộc về một quản lý và có các thông tin như tiêu đề, nội dung, loại báo cáo, tệp đính kèm, trạng thái xử lý và đánh giá của quản trị viên.

const reportSchema = new mongoose.Schema(
    {
        managerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        buildingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Building",
            required: true,
        },
        title: {
            type: String,
            required: [true, "Tiêu đề là bắt buộc"],
            trim: true,
        },
        content: {
            type: String,
            required: [true, "Nội dung là bắt buộc"],
        },
        type: {
            type: String,
            enum: ["general", "maintenance", "incident", "monthly"],
            default: "general",
        },
        attachments: [
            {
                type: String,
            },
        ],
        status: {
            type: String,
            enum: ["pending", "reviewed"],
            default: "pending",
        },
        adminReview: {
            reviewedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
            note: { type: String },
            reviewedAt: { type: Date },
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Report", reportSchema);
