import express from "express";
import Doctor from "../models/Doctor.js";
import { nextSequence } from "../models/Counter.js";
import { verifyToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// @route   GET /api/doctors
// @desc    List every doctor. PUBLIC — the About page and the Book page
//          need this even for visitors who aren't logged in yet.
router.get("/", async (req, res) => {
  try {
    const doctors = await Doctor.find().sort({ department: 1, name: 1 });
    res.status(200).json({ success: true, count: doctors.length, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// @route   POST /api/doctors
// @desc    Add a doctor to a department (creates the department too if new).
//          ADMIN ONLY.
router.post("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, department } = req.body;

    if (!name || name.trim().length < 3)
      return res.status(400).json({ success: false, message: "Enter the doctor's full name." });
    if (!department || department.trim().length < 2)
      return res.status(400).json({ success: false, message: "Enter a department name." });

    const trimmedName = name.trim();
    const trimmedDept = department.trim();

    // Case-insensitive duplicate check, same rule as the original app.
    const duplicate = await Doctor.findOne({
      name: new RegExp(`^${trimmedName}$`, "i"),
      department: new RegExp(`^${trimmedDept}$`, "i"),
    });
    if (duplicate)
      return res.status(400).json({
        success: false,
        message: "This doctor is already listed in that department.",
      });

    const seq = await nextSequence("doctor");
    const id = "DR-" + String(seq).padStart(4, "0");

    const doctor = await Doctor.create({ id, seq, name: trimmedName, department: trimmedDept });

    res.status(201).json({
      success: true,
      message: `${doctor.name} added to ${doctor.department}.`,
      data: doctor,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// @route   DELETE /api/doctors/:id
// @desc    Remove a doctor by their friendly ID (e.g. "DR-0003"). ADMIN ONLY.
router.delete("/:id", verifyToken, requireAdmin, async (req, res) => {
  try {
    const doctor = await Doctor.findOneAndDelete({ id: req.params.id });
    if (!doctor)
      return res.status(404).json({ success: false, message: "Doctor not found" });

    res.status(200).json({ success: true, message: "Doctor removed", data: doctor });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

export default router;
