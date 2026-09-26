/**
 * One-time (or repeatable) script to fill your MongoDB database with the
 * same demo doctors, patients, and appointments your original common.js
 * used to create automatically in localStorage. Run it with:
 *
 *   npm run seed
 *
 * It's safe to run more than once — it clears the relevant collections
 * first, so you always end up with a clean, predictable demo dataset.
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

import Doctor from "./models/Doctor.js";
import Patient from "./models/Patient.js";
import Appointment from "./models/Appointment.js";
import Counter from "./models/Counter.js";

dotenv.config();

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB. Seeding demo data…");

  await Promise.all([
    Doctor.deleteMany({}),
    Patient.deleteMany({}),
    Appointment.deleteMany({}),
    Counter.deleteMany({}),
  ]);

  /* ---------------- Doctors ---------------- */
  const doctorsData = [
    { seq: 1, id: "DR-0001", name: "Dr. Bello Adeyemi", department: "General Medicine" },
    { seq: 2, id: "DR-0002", name: "Dr. Grace Ihenacho", department: "General Medicine" },
    { seq: 3, id: "DR-0003", name: "Dr. Funmilayo Kuti", department: "Pediatrics" },
    { seq: 4, id: "DR-0004", name: "Dr. Samuel Attah", department: "Pediatrics" },
    { seq: 5, id: "DR-0005", name: "Dr. Chidi Nwosu", department: "Cardiology" },
    { seq: 6, id: "DR-0006", name: "Dr. Ifeoma Obi", department: "Cardiology" },
    { seq: 7, id: "DR-0007", name: "Dr. Layla Musa", department: "Dermatology" },
    { seq: 8, id: "DR-0008", name: "Dr. Tunde Fashola", department: "Orthopedics" },
    { seq: 9, id: "DR-0009", name: "Dr. Peter Ogunye", department: "Dental" },
  ];
  await Doctor.insertMany(doctorsData);
  await Counter.findByIdAndUpdate("doctor", { seq: doctorsData.length }, { upsert: true });
  console.log(`  → ${doctorsData.length} doctors added`);

  /* ---------------- Patients ---------------- */
  // Demo login password for BOTH patients below: password123
  const demoHash = await bcrypt.hash("password123", 10);

  const patientsData = [
    {
      seq: 1, id: "PT-0001", name: "Amara Okafor", dob: "1990-04-12",
      gender: "Female", phone: "08031234567", email: "amara.okafor@gmail.com",
      address: "14 Marina Road, Lagos", blood: "O+", emergency: "08039876543",
      password: demoHash,
    },
    {
      seq: 2, id: "PT-0002", name: "Chinedu Eze", dob: "1985-11-02",
      gender: "Male", phone: "08123456789", email: "chinedu@gmail.com",
      address: "9 Adeola Street, Lagos", blood: "A+", emergency: "",
      password: demoHash,
    },
  ];
  await Patient.insertMany(patientsData);
  await Counter.findByIdAndUpdate("patient", { seq: patientsData.length }, { upsert: true });
  console.log(`  → ${patientsData.length} patients added (login password: password123)`);

  /* ---------------- Appointments ---------------- */
  const today = new Date();
  const in2 = new Date(today); in2.setDate(in2.getDate() + 2);
  const in5 = new Date(today); in5.setDate(in5.getDate() + 5);
  const past1 = new Date(today); past1.setDate(past1.getDate() + 1);

  const apptsData = [
    {
      seq: 1, id: "AP-0001", patientId: "PT-0001", patientName: "Amara Okafor",
      department: "General Medicine", doctor: "Dr. Bello Adeyemi",
      date: in2.toISOString().split("T")[0], time: "10:00",
      reason: "Routine checkup", status: "approved",
    },
    {
      seq: 2, id: "AP-0002", patientId: "PT-0002", patientName: "Chinedu Eze",
      department: "Cardiology", doctor: "Dr. Chidi Nwosu",
      date: in5.toISOString().split("T")[0], time: "14:00",
      reason: "Follow-up consultation", status: "pending",
    },
    {
      seq: 3, id: "AP-0003", patientId: "PT-0001", patientName: "Amara Okafor",
      department: "Dermatology", doctor: "Dr. Layla Musa",
      date: past1.toISOString().split("T")[0], time: "09:30",
      reason: "Skin consultation", status: "cancelled",
    },
  ];
  await Appointment.insertMany(apptsData);
  await Counter.findByIdAndUpdate("appointment", { seq: apptsData.length }, { upsert: true });
  console.log(`  → ${apptsData.length} appointments added`);

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seeding failed:", error.message);
  process.exit(1);
});
