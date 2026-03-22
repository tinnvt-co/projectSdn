const mongoose = require("mongoose");
// Mô hình dữ liệu cho đăng ký phòng của sinh viên
// Mỗi bản ghi sẽ liên kết một sinh viên với một phòng cụ thể trong một kỳ học nhất định, cùng với trạng thái và thông tin đánh giá của quản lý.

const violationRecordSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },
        roomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            required: true,
        },
        type: {
            type: String,
            enum: ["curfew", "noise", "damage", "unauthorized_guest", "other"],
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        fineAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        invoiceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Invoice",
            default: null,
        },
        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        evidence: [
            {
                type: String,
            },
        ],
        status: {
            type: String,
            enum: ["reported", "invoiced", "resolved"],
            default: "reported",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("ViolationRecord", violationRecordSchema);
