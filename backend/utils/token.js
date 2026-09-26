import jwt from "jsonwebtoken";

/**
 * Creates a signed JWT (JSON Web Token) that encodes who the logged-in
 * user is. The frontend stores this token and sends it back on every
 * request that needs to know "who is asking?" (booking an appointment,
 * viewing the patient directory, etc). See README.md → "How login and
 * sessions work" for the full explanation.
 */
export function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
}
