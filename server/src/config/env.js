import dotenv from "dotenv";

dotenv.config();

if (
  !process.env.JWT_SECRET ||
  process.env.JWT_SECRET.length < 32 ||
  process.env.JWT_SECRET.startsWith("replace-")
) {
  throw new Error("JWT_SECRET must be set to at least 32 characters.");
}
