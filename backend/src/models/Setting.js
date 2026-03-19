const mongoose = require("mongoose");
// Mô hình dữ liệu cho cài đặt hệ thống
// Mỗi cài đặt sẽ có một khóa (key) duy nhất, giá trị (value) có thể là bất kỳ kiểu dữ liệu nào, mô tả về cài đặt và thông tin người cập nhật cuối cùng.
const settingSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        value: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
        description: {
            type: String,
            trim: true,
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Setting", settingSchema);
