import express from "express";
import Appointment from "../models/Appointment.js";
import { nextSequence } from "../models/Counter.js";
import { verifyToken, requirePatient, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// @route   GET /api/appointments
// @desc    List appointments. A patient only ever sees their OWN
//          appointments; an admin sees everyone's. Which one happens is
//          decided here on the server from the JWT — never trust a
//          filter the browser sends, since it could be tampered with.
router.get("/", verifyToken, async (req, res) => {
  try {
    const filter = req.user.role === "admin" ? {} : { patientId: req.user.patientId };
    const appointments = await Appointment.find(filter).sort({ date: -1, time: -1 });
    res.status(200).json({ success: true, count: appointments.length, data: appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// @route   POST /api/appointments
// @desc    Book a new appointment. PATIENT ONLY. patientId/patientName come
//          from the logged-in patient's token, not from the request body —
//          otherwise a patient could book an appointment "as" someone else.
router.post("/", verifyToken, requirePatient, async (req, res) => {
  try {
    const { department, doctor, date, time, reason } = req.body;

    if (!department) return res.status(400).json({ success: false, message: "Select a department." });
    if (!doctor) return res.status(400).json({ success: false, message: "Select a doctor." });
    if (!date) return res.status(400).json({ success: false, message: "Choose a date." });
    if (!time) return res.status(400).json({ success: false, message: "Choose a time slot." });

    // Same double-booking guard as the original book.js, now enforced
    // server-side so it can't be bypassed by skipping the browser check.
    const clash = await Appointment.findOne({
      doctor, date, time, status: { $ne: "cancelled" },
    });
    if (clash) {
      return res.status(400).json({
        success: false,
        message: `${doctor} already has an appointment at ${time} on ${date}. Please choose another slot.`,
      });
    }

    const seq = await nextSequence("appointment");
    const id = "AP-" + String(seq).padStart(4, "0");

    const appointment = await Appointment.create({
      id, seq,
      patientId: req.user.patientId,
      patientName: req.user.patientName,
      department,
      doctor,
      date,
      time,
      reason: reason || "",
      status: "pending",
    });

    res.status(201).json({ success: true, message: "Appointment booked", data: appointment });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// @route   PATCH /api/appointments/:id/cancel
// @desc    Cancel an appointment. A patient may cancel their own; an admin
//          may cancel any.
router.patch("/:id/cancel", verifyToken, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ id: req.params.id });
    if (!appointment)
      return res.status(404).json({ success: false, message: "Appointment not found" });

    if (req.user.role === "patient" && appointment.patientId !== req.user.patientId) {
      return res.status(403).json({
        success: false,
        message: "You can only cancel your own appointments.",
      });
    }

    appointment.status = "cancelled";
    await appointment.save();

    res.status(200).json({
      success: true,
      message: `Appointment ${appointment.id} has been cancelled.`,
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// @route   PATCH /api/appointments/:id/approve
// @desc    Approve a pending appointment. ADMIN ONLY.
router.patch("/:id/approve", verifyToken, requireAdmin, async (req, res) => {
  try {
    const appointment = await Appointment.findOne({ id: req.params.id });
    if (!appointment)
      return res.status(404).json({ success: false, message: "Appointment not found" });

    appointment.status = "approved";
    await appointment.save();

    res.status(200).json({
      success: true,
      message: `Appointment ${appointment.id} approved.`,
      data: appointment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

export default router;
