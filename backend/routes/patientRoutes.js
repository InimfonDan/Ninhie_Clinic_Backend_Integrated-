import express from "express";
import Patient from "../models/Patient.js";
import Appointment from "../models/Appointment.js";
import { verifyToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// @route   GET /api/patients
// @desc    List every registered patient, for the Patient Directory page.
//          ADMIN ONLY — this is personal data, patients should never be
//          able to fetch each other's records.
router.get("/", verifyToken, requireAdmin, async (req, res) => {
  try {
    // .select("-password") strips the hashed password out of the response.
    // There's no reason it should ever leave the server, hashed or not.
    const patients = await Patient.find().select("-password").sort({ name: 1 });
    const appts = await Appointment.find();

    // Attach an appointment count to each patient, same as the original
    // directory.js computed on the fly from local data.
    const data = patients.map((p) => ({
      ...p.toObject(),
      appointmentCount: appts.filter((a) => a.patientId === p.id).length,
    }));

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

export default router;
