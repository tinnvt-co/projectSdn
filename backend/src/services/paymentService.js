const Payment = require("../models/Payment");
const Invoice = require("../models/Invoice");
const PaymentSession = require("../models/PaymentSession");
const Student = require("../models/Student");
const RoomAssignment = require("../models/RoomAssignment");
const RoomRegistration = require("../models/RoomRegistration");
const Room = require("../models/Room");

const calcRoomStatus = (room) => {
    if (room.status === "maintenance") return "maintenance";
    if (room.currentOccupancy >= room.maxOccupancy) return "full";
    if (room.currentOccupancy > 0) return "partial";
    return "available";
};

const decreaseRoomOccupancy = async (roomId) => {
    if (!roomId) return;

    const room = await Room.findById(roomId);
    if (!room) return;

    room.currentOccupancy = Math.max(0, room.currentOccupancy - 1);
    room.status = calcRoomStatus(room);
    await room.save();
};

const getInvoiceStatus = (invoice) => {
    if ((invoice.paidAmount || 0) >= (invoice.amount || 0)) return "paid";
    if ((invoice.paidAmount || 0) > 0) return new Date(invoice.dueDate) < new Date() ? "overdue" : "partial";
    return new Date(invoice.dueDate) < new Date() ? "overdue" : "unpaid";
};

const activateRoomForPaidBooking = async ({ studentId, reviewedBy }) => {
    const student = await Student.findById(studentId);
    if (!student || student.currentRoomId) return null;

    const booking = await RoomRegistration.findOne({
        studentId,
        status: "approved",
        activatedAt: null,
    })
        .sort({ createdAt: -1 })
        .populate("roomId");

    if (!booking?.roomId) return null;

    const invoices = await Invoice.find({
        studentId,
        roomId: booking.roomId._id,
        termCode: booking.termCode,
        type: "room_fee",
    }).lean();

    if (invoices.length < 1 || invoices.some((invoice) => invoice.status !== "paid")) {
        return null;
    }

    await RoomAssignment.updateMany(
        { studentId, status: "active" },
        { $set: { status: "ended", endDate: new Date() } }
    );

    const assignment = await RoomAssignment.create({
        studentId,
        roomId: booking.roomId._id,
        buildingId: booking.roomId.buildingId,
        termCode: booking.termCode,
        startDate: new Date(),
        status: "active",
    });

    student.currentRoomId = booking.roomId._id;
    await student.save();

    booking.activatedAt = new Date();
    booking.reviewNote = booking.reviewNote
        ? `${booking.reviewNote}. Da kich hoat phong sau khi thanh toan hoa don tien phong`
        : "Da kich hoat phong sau khi thanh toan hoa don tien phong";
    if (reviewedBy) booking.reviewedBy = reviewedBy;
    await booking.save();

    return assignment;
};

const releaseExpiredBookingHolds = async ({ studentId = null, now = new Date() } = {}) => {
    const bookingQuery = {
        status: "approved",
        activatedAt: null,
    };

    if (studentId) bookingQuery.studentId = studentId;

    const bookings = await RoomRegistration.find(bookingQuery).sort({ createdAt: 1 });
    const releasedBookingIds = [];

    for (const booking of bookings) {
        const invoices = await Invoice.find({
            studentId: booking.studentId,
            roomId: booking.roomId,
            termCode: booking.termCode,
            type: "room_fee",
        });

        if (invoices.length === 0) continue;

        const hasAnyPayment = invoices.some((invoice) => (invoice.paidAmount || 0) > 0);
        if (hasAnyPayment) continue;

        const latestDueDate = invoices.reduce((latest, invoice) => {
            if (!invoice.dueDate) return latest;
            const dueDate = new Date(invoice.dueDate);
            if (Number.isNaN(dueDate.getTime())) return latest;
            return !latest || dueDate > latest ? dueDate : latest;
        }, null);

        if (!latestDueDate || latestDueDate >= now) continue;

        await decreaseRoomOccupancy(booking.roomId);

        booking.status = "cancelled";
        booking.reviewedAt = now;
        booking.reviewNote = booking.reviewNote
            ? `${booking.reviewNote}. Tu dong huy giu cho do qua han thanh toan`
            : "Tu dong huy giu cho do qua han thanh toan";
        await booking.save();

        const invoiceIds = invoices.map((invoice) => invoice._id);
        if (invoiceIds.length > 0) {
            await PaymentSession.deleteMany({
                studentId: booking.studentId,
                status: { $in: ["pending", "expired", "cancelled"] },
                invoiceIds: { $in: invoiceIds },
            });
            await Invoice.deleteMany({ _id: { $in: invoiceIds }, paidAmount: 0 });
        }

        releasedBookingIds.push(String(booking._id));
    }

    return releasedBookingIds;
};

const completeQrPaymentSession = async ({
    session,
    transactionCode,
    note,
    paidAt = new Date(),
    reviewedBy = null,
}) => {
    const liveSession = session instanceof PaymentSession
        ? session
        : await PaymentSession.findById(session?._id || session);

    if (!liveSession) {
        throw new Error("Khong tim thay phien thanh toan QR");
    }

    if (liveSession.status === "completed") {
        return {
            session: liveSession,
            totalPaid: 0,
            count: 0,
            alreadyCompleted: true,
        };
    }

    if (liveSession.status !== "pending") {
        throw new Error("Phien thanh toan QR khong con hieu luc");
    }

    if (new Date(liveSession.expiresAt) < new Date()) {
        liveSession.status = "expired";
        await liveSession.save();
        throw new Error("Ma QR da het han");
    }

    const invoices = await Invoice.find({
        _id: { $in: liveSession.invoiceIds },
        studentId: liveSession.studentId,
    });

    const createdPayments = [];
    let totalPaid = 0;

    for (const invoice of invoices) {
        const remainingAmount = Math.max(0, (invoice.amount || 0) - (invoice.paidAmount || 0));
        if (remainingAmount <= 0) continue;

        const payment = await Payment.create({
            invoiceId: invoice._id,
            studentId: liveSession.studentId,
            amount: remainingAmount,
            paymentMethod: "bank_transfer",
            transactionCode: transactionCode || liveSession.sessionCode,
            note: note || `Thanh toan QR - ${liveSession.transferContent}`,
            paidAt,
        });

        invoice.paidAmount = (invoice.paidAmount || 0) + remainingAmount;
        invoice.status = getInvoiceStatus(invoice);
        await invoice.save();

        createdPayments.push(payment);
        totalPaid += remainingAmount;
    }

    liveSession.status = "completed";
    liveSession.confirmedAt = paidAt;
    await liveSession.save();

    await activateRoomForPaidBooking({ studentId: liveSession.studentId, reviewedBy });

    return {
        session: liveSession,
        totalPaid,
        count: createdPayments.length,
        alreadyCompleted: false,
    };
};

module.exports = {
    getInvoiceStatus,
    activateRoomForPaidBooking,
    completeQrPaymentSession,
    releaseExpiredBookingHolds,
};
