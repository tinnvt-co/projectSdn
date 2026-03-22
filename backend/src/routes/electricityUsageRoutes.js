const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  createElectricityUsage,
  getAllElectricityUsages,
  getElectricityUsageById,
  updateElectricityUsage,
  deleteElectricityUsage,
} = require("../controllers/ElectricityUsage.controller");

router.use(protect, authorize("admin"));

router.post("/", createElectricityUsage);
router.get("/", getAllElectricityUsages);
router.get("/:id", getElectricityUsageById);
router.put("/:id", updateElectricityUsage);
router.delete("/:id", deleteElectricityUsage);

module.exports = router;
