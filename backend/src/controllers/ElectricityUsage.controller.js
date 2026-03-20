const ElectricityUsage = require("../models/ElectricityUsage");
const Setting = require("../models/Setting");
require("../models/Room");
require("../models/User");
// ========================
// 1. CRUD điện năng tiêu thụ
// ========================

const getNumberSetting = async (key, defaultValue) => {
  const setting = await Setting.findOne({ key });
  const value = Number(setting?.value);
  return Number.isFinite(value) ? value : defaultValue;
};

const buildComputedUsage = ({ previousReading, currentReading, freeKwh, excessPrice }) => {
  const prev = Number(previousReading);
  const curr = Number(currentReading);

  if (!Number.isFinite(prev) || !Number.isFinite(curr)) {
    throw new Error("Readings must be numeric values");
  }

  if (curr < prev) {
    throw new Error("currentReading must be greater than or equal to previousReading");
  }

  const totalKwh = curr - prev;
  const free = Math.max(0, Math.min(Number(freeKwh), totalKwh));
  const excessKwh = Math.max(0, totalKwh - free);
  const excessAmount = excessKwh * Number(excessPrice);

  return {
    totalKwh,
    freeKwh: free,
    excessKwh,
    excessAmount,
  };
};

const createElectricityUsage = async (req, res) => {
  try {
    const { roomId, month, year, previousReading, currentReading } = req.body;

    const existing = await ElectricityUsage.findOne({ roomId, month, year });
    if (existing) {
      return res.status(400).json({ message: "Electricity usage for this room/month/year already exists" });
    }

    const freeLimit =
      req.body.freeKwh !== undefined
        ? Number(req.body.freeKwh)
        : await getNumberSetting("electricity_free_limit", 50);

    const excessPrice = await getNumberSetting("electricity_excess_price", 3500);

    const computed = buildComputedUsage({
      previousReading,
      currentReading,
      freeKwh: freeLimit,
      excessPrice,
    });

    const usage = new ElectricityUsage({
      ...req.body,
      ...computed,
    });

    const savedUsage = await usage.save();
    res.status(201).json(savedUsage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllElectricityUsages = async (req, res) => {
  try {
    const { roomId, month, year } = req.query;
    const filter = {};

    if (roomId) filter.roomId = roomId;
    if (month) filter.month = Number(month);
    if (year) filter.year = Number(year);

    const usages = await ElectricityUsage.find(filter)
      .populate("roomId", "roomNumber floor")
      .populate("recordedBy", "username email")
      .sort({ year: -1, month: -1, createdAt: -1 });

    res.status(200).json(usages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getElectricityUsageById = async (req, res) => {
  try {
    const usage = await ElectricityUsage.findById(req.params.id)
      .populate("roomId", "roomNumber floor")
      .populate("recordedBy", "username email");

    if (!usage) {
      return res.status(404).json({ message: "Electricity usage not found" });
    }

    res.status(200).json(usage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateElectricityUsage = async (req, res) => {
  try {
    const usage = await ElectricityUsage.findById(req.params.id);
    if (!usage) {
      return res.status(404).json({ message: "Electricity usage not found" });
    }

    const nextRoomId = req.body.roomId ?? usage.roomId;
    const nextMonth = req.body.month ?? usage.month;
    const nextYear = req.body.year ?? usage.year;

    const duplicate = await ElectricityUsage.findOne({
      _id: { $ne: usage._id },
      roomId: nextRoomId,
      month: nextMonth,
      year: nextYear,
    });

    if (duplicate) {
      return res.status(400).json({ message: "Electricity usage for this room/month/year already exists" });
    }

    const nextPreviousReading = req.body.previousReading ?? usage.previousReading;
    const nextCurrentReading = req.body.currentReading ?? usage.currentReading;

    const freeLimit =
      req.body.freeKwh !== undefined
        ? Number(req.body.freeKwh)
        : await getNumberSetting("electricity_free_limit", Number(usage.freeKwh ?? 50));

    const excessPrice = await getNumberSetting("electricity_excess_price", 3500);

    const computed = buildComputedUsage({
      previousReading: nextPreviousReading,
      currentReading: nextCurrentReading,
      freeKwh: freeLimit,
      excessPrice,
    });

    usage.roomId = nextRoomId;
    usage.month = nextMonth;
    usage.year = nextYear;
    usage.previousReading = nextPreviousReading;
    usage.currentReading = nextCurrentReading;
    usage.recordedBy = req.body.recordedBy ?? usage.recordedBy;
    usage.totalKwh = computed.totalKwh;
    usage.freeKwh = computed.freeKwh;
    usage.excessKwh = computed.excessKwh;
    usage.excessAmount = computed.excessAmount;

    const updatedUsage = await usage.save();
    res.status(200).json(updatedUsage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteElectricityUsage = async (req, res) => {
  try {
    const deletedUsage = await ElectricityUsage.findByIdAndDelete(req.params.id);

    if (!deletedUsage) {
      return res.status(404).json({ message: "Electricity usage not found" });
    }

    res.status(200).json({ message: "Electricity usage deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createElectricityUsage,
  getAllElectricityUsages,
  getElectricityUsageById,
  updateElectricityUsage,
  deleteElectricityUsage,
};
