import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* ---------------- Middleware ---------------- */

// Your frontend (opened via Live Server, or as a plain file) runs on a
// different "origin" than this API (http://localhost:5000). Without CORS
// enabled, the browser blocks the frontend's requests to this server for
// security reasons. This line tells the browser it's OK.
app.use(cors());

// Lets Express read a JSON body (req.body) from incoming requests.
app.use(express.json());

// Simple request logger, active only in development.
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
  });
}

/* ---------------- Routes ---------------- */

app.get("/", (req, res) => {
  res.status(200).json({ message: "Ninhie Clinic API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/appointments", appointmentRoutes);

// Catch-all for any URL that doesn't match a route above.
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

/* ---------------- Connect to MongoDB, then start listening ---------------- */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
    app.listen(PORT, () => {
      console.log(
        `Server running in ${process.env.NODE_ENV || "development"} mode on http://localhost:${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  });
