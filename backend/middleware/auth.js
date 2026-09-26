import jwt from "jsonwebtoken";

/**
 * Runs before any route that requires the visitor to be logged in
 * (patient OR admin). Reads the token from the "Authorization" header,
 * verifies it hasn't been tampered with or expired, and — if valid —
 * attaches the decoded info to req.user so the route handler knows
 * who's asking (e.g. req.user.role, req.user.patientId).
 */
export function verifyToken(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "No session found. Please log in.",
    });
  }

  const token = header.split(" ")[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Your session has expired or is invalid. Please log in again.",
    });
  }
}

/** Run AFTER verifyToken. Blocks the route unless the caller is a patient. */
export function requirePatient(req, res, next) {
  if (req.user.role !== "patient") {
    return res.status(403).json({
      success: false,
      message: "This action is only available to patients.",
    });
  }
  next();
}

/** Run AFTER verifyToken. Blocks the route unless the caller is an admin. */
export function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "This action is only available to admins.",
    });
  }
  next();
}
