const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
    {
        invoiceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Invoice",
            required: true,
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        paymentMethod: {
            type: String,
            enum: ["cash", "bank_transfer", "e_wallet"],
            required: true,
        },
        transactionCode: {
            type: String,
            trim: true,
            default: null,
        },
        note: {
            type: String,
            trim: true,
            default: "",
        },
        paidAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

paymentSchema.index({ studentId: 1, paidAt: -1 });
paymentSchema.index({ invoiceId: 1, paidAt: -1 });
paymentSchema.index(
    { transactionCode: 1 },
    {
        unique: true,
        sparse: true,
    }
);

module.exports = mongoose.model("Payment", paymentSchema);
