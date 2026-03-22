const express = require("express");
const router = express.Router();
// Routes cho quản lý phân công phòng ở của sinh viên
// Bao gồm tạo, đọc, cập nhật, kết thúc, hủy phân công phòng ở liên quan đến sinh viên và phòng ở

const {
  createAssignment,
  getAllAssignments,
  getAssignmentById,
  updateAssignment,
  endAssignment,
  cancelAssignment,
  getAssignmentsByStudent,
  getAssignmentsByRoom,
  getAssignmentsByBuilding,
  getAssignmentsByTerm,
  getAssignmentsByStatus,
  getActiveAssignments,
} = require("../controllers/RoomAssignment.controller");

// ===== Thống kê (đặt trước :id để tránh conflict) =====
router.get("/active", getActiveAssignments);

// ===== Tìm kiếm / Lọc =====
router.get("/student/:studentId", getAssignmentsByStudent);
router.get("/room/:roomId", getAssignmentsByRoom);
router.get("/building/:buildingId", getAssignmentsByBuilding);
router.get("/term/:termCode", getAssignmentsByTerm);
router.get("/status/:status", getAssignmentsByStatus);

// ===== CRUD =====
router.post("/", createAssignment);
router.get("/", getAllAssignments);
router.get("/:id", getAssignmentById);
router.put("/:id", updateAssignment);

// ===== Kết thúc / Hủy =====
router.patch("/:id/end", endAssignment);
router.patch("/:id/cancel", cancelAssignment);

module.exports = router;
