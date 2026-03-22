const express = require("express");
const router = express.Router();
// Routes cho quản lý vi phạm của sinh viên
// Bao gồm tạo, đọc, cập nhật, xóa bản ghi vi phạm liên quan đến sinh viên và phòng ở

const {
  createViolationRecord,
  getAllViolationRecords,
  getViolationRecordById,
  updateViolationRecord,
  updateViolationRecordStatus,
  deleteViolationRecord,
} = require("../controllers/ViolationRecord.controller");

router.post("/", createViolationRecord);
router.get("/", getAllViolationRecords);
router.get("/:id", getViolationRecordById);
router.put("/:id", updateViolationRecord);
router.patch("/:id/status", updateViolationRecordStatus);
router.delete("/:id", deleteViolationRecord);

module.exports = router;
