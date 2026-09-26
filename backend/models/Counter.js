import mongoose from "mongoose";

/**
 * A tiny "number generator" collection.
 *
 * MongoDB's real IDs (_id) are long random strings like
 * "65f1a2b3c4d5e6f7a8b9c0d1" — not the friendly "PT-0001" / "DR-0002" /
 * "AP-0003" style IDs your original localStorage version used.
 *
 * This model keeps one document per "counter name" (e.g. "patient"),
 * and every time we need a new ID we atomically increment its `seq`
 * field by 1. "Atomically" means MongoDB guarantees two requests
 * arriving at the same instant still get two different numbers —
 * no duplicate IDs, even under load.
 */
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g. "patient", "doctor", "appointment"
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model("Counter", counterSchema);

export async function nextSequence(name) {
  const counter = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true } // upsert: create the counter doc if it doesn't exist yet
  );
  return counter.seq;
}

export default Counter;
