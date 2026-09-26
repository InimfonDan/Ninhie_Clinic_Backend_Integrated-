import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true }, // friendly display ID, e.g. "PT-0001"
    seq: Number,
    name: { type: String, required: true, trim: true, minlength: 3 },
    dob: { type: String, required: true },
    gender: { type: String, required: true },
    phone: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: "" },
    address: { type: String, required: true, trim: true, minlength: 5 },
    blood: { type: String, default: "" },
    emergency: { type: String, default: "" },
    // Stores a BCRYPT HASH, never the plain password. See routes/authRoutes.js.
    password: { type: String, required: true },
  },
  { timestamps: true }
);

const Patient = mongoose.model("Patient", patientSchema);

export default Patient;
