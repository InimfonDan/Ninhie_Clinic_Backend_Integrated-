import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true }, // friendly display ID, e.g. "DR-0001"
    seq: Number,
    name: { type: String, required: true, trim: true, minlength: 3 },
    department: { type: String, required: true, trim: true, minlength: 2 },
  },
  { timestamps: true }
);

const Doctor = mongoose.model("Doctor", doctorSchema);

export default Doctor;
