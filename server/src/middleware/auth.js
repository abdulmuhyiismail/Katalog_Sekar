import "../config/env.js";
import jwt from "jsonwebtoken";
import { db } from "../db/db.js";

const JWT_SECRET = process.env.JWT_SECRET;

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token is missing",
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res
        .status(403)
        .json({ success: false, message: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

function requireRole(role) {
  return (req, res, next) => {
    const isLegacyAdminToken = role === "admin" && !req.user?.role;
    if (req.user?.role !== role && !isLegacyAdminToken) {
      return res.status(403).json({
        success: false,
        message: "Akun tidak memiliki izin untuk mengakses fitur ini.",
      });
    }
    next();
  };
}

export const authenticateAdmin = (req, res, next) =>
  authenticateToken(req, res, () =>
    requireRole("admin")(req, res, () => {
      if (!db.getAdminById(req.user.sub)) {
        return res.status(401).json({
          success: false,
          message: "Sesi administrator tidak lagi berlaku. Silakan masuk kembali.",
        });
      }
      next();
    }),
  );

export const authenticateUser = (req, res, next) =>
  authenticateToken(req, res, () =>
    requireRole("user")(req, res, next),
  );

export { JWT_SECRET };