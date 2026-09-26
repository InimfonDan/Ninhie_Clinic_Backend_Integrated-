import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true }, // friendly display ID, e.g. "AP-0001"
    seq: Number,
    patientId: { type: String, required: true }, // Patient.id, e.g. "PT-0001"
    patientName: { type: String, required: true }, // snapshot, so it still shows even if patient details change later
    department: { type: String, required: true },
    doctor: { type: String, required: true }, // doctor's name, matching Doctor.name
    date: { type: String, required: true }, // "YYYY-MM-DD"
    time: { type: String, required: true }, // "HH:MM"
    reason: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

export default Appointment;
