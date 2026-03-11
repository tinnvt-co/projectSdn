const express = require("express");
const router = express.Router();
const { getAllInvoices, createInvoice, getDebtors, searchStudents } = require("../controllers/invoiceController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);
router.use(authorize("admin"));

router.get("/search-students", searchStudents);   // tìm sinh viên để gửi bill
router.get("/debtors", getDebtors);               // danh sách sinh viên còn nợ
router.get("/", getAllInvoices);                   // tất cả hóa đơn
router.post("/", createInvoice);                  // tạo hóa đơn mới

module.exports = router;
