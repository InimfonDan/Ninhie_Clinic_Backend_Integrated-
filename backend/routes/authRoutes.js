import express from "express";
import bcrypt from "bcryptjs";
import Patient from "../models/Patient.js";
import { nextSequence } from "../models/Counter.js";
import { signToken } from "../utils/token.js";
import crypto from "crypto";

const router = express.Router();

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function isValidPhone(v) {
  return /^[0-9+\-\s()]{7,20}$/.test(v) && v.replace(/\D/g, "").length >= 7;
}

//  Create a new patient account and log them straight in
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      dob,
      gender,
      phone,
      email,
      address,
      blood,
      emergency,
      password,
      password2,
    } = req.body;

    // Same validation rules your original register.js enforced in the browser —
    // now also enforced here, since a browser check alone can always be bypassed.
    if (!name || name.trim().length < 3)
      return res.status(400).json({
        success: false,
        message: "Enter your full name (at least 3 characters).",
      });
    if (!dob || new Date(dob) >= new Date())
      return res.status(400).json({
        success: false,
        message: "Enter a valid date of birth in the past.",
      });
    if (!gender)
      return res
        .status(400)
        .json({ success: false, message: "Select a gender." });
    if (!isValidPhone(phone))
      return res
        .status(400)
        .json({ success: false, message: "Enter a valid phone number." });
    if (email && !isValidEmail(email))
      return res
        .status(400)
        .json({ success: false, message: "Enter a valid email address." });
    if (!address || address.trim().length < 5)
      return res.status(400).json({
        success: false,
        message: "Enter a valid address (at least 5 characters).",
      });

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{6,}$/;
    if (!passwordRegex.test(password))
      return res.status(400).json({
        success: false,
        message:
          "Password must be 6+ characters and include an uppercase letter, a lowercase letter, and a symbol.",
      });
    if (password !== password2)
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match." });

    const existing = await Patient.findOne({ phone: phone.trim() });
    if (existing)
      return res.status(400).json({
        success: false,
        message:
          "An account with this phone number already exists. Try logging in instead.",
      });

    const seq = await nextSequence("patient");
    const id = "PT-" + String(seq).padStart(4, "0");

    // Never store the plain password — bcrypt.hash() turns it into a
    // one-way scrambled string. Even if the database were ever leaked,
    // the original passwords can't be recovered from the hash.
    const hashedPassword = await bcrypt.hash(password, 10);

    const patient = await Patient.create({
      id,
      seq,
      name: name.trim(),
      dob,
      gender,
      phone: phone.trim(),
      email: email ? email.trim().toLowerCase() : "",
      address: address.trim(),
      blood: blood || "",
      emergency: emergency || "",
      password: hashedPassword,
    });

    const session = {
      role: "patient",
      patientId: patient.id,
      patientName: patient.name,
    };
    const token = signToken(session);

    res.status(201).json({
      success: true,
      message: `Welcome, ${patient.name}!`,
      token,
      session,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Log an existing patient in with phone/email + password

const GENERIC_FAIL =
  "No account matches those details. Check your login ID and password.";

// Constant-time string comparison (hashing first avoids length mismatch errors)
function safeEqual(a = "", b = "") {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

router.post("/login", async (req, res) => {
  try {
    const { loginId, password } = req.body;
    if (!loginId || !password)
      return res
        .status(400)
        .json({ success: false, message: "Enter your login ID and password." });

    const id = loginId.trim();

    // 1. Admin: loginId matches the admin username
    if (safeEqual(id, process.env.ADMIN_USERNAME)) {
      if (!safeEqual(password, process.env.ADMIN_PASSWORD))
        return res.status(400).json({ success: false, message: GENERIC_FAIL });

      const session = { role: "admin" };
      return res.status(200).json({
        success: true,
        message: "Welcome back! Redirecting to the admin dashboard…",
        token: signToken(session),
        session,
      });
    }

    // 2. Patient: loginId is a phone or email
    const patient = await Patient.findOne({
      $or: [{ phone: id }, { email: id.toLowerCase() }],
    });

    // Same message for "no account" and "wrong password"
    if (!patient || !(await bcrypt.compare(password, patient.password)))
      return res.status(400).json({ success: false, message: GENERIC_FAIL });

    const session = {
      role: "patient",
      patientId: patient.id,
      patientName: patient.name,
    };
    res.status(200).json({
      success: true,
      message: `Welcome back, ${patient.name}!`,
      token: signToken(session),
      session,
    });
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error. Please try again." });
  }
});

export default router;
