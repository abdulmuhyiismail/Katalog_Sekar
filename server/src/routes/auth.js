import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db/db.js";
import {
  authenticateAdmin,
  authenticateUser,
  JWT_SECRET,
} from "../middleware/auth.js";

const router = express.Router();

function createToken(user, role) {
  if (!JWT_SECRET) {
    const error = new Error("JWT_SECRET is not configured");
    error.status = 500;
    throw error;
  }

  return jwt.sign(
    { sub: user.id, role, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: role === "admin" ? "24h" : "7d" },
  );
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    ...(user.createdAt ? { createdAt: user.createdAt } : {}),
  };
}

router.post("/register", async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email =
    typeof req.body?.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
  const password =
    typeof req.body?.password === "string" ? req.body.password : "";

  if (name.length < 2 || name.length > 80) {
    return res.status(400).json({
      success: false,
      message: "Nama harus berisi 2 sampai 80 karakter.",
    });
  }
  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return res.status(400).json({
      success: false,
      message: "Masukkan alamat email yang valid.",
    });
  }
  if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
    return res.status(400).json({
      success: false,
      message: "Kata sandi harus minimal 8 karakter dan maksimal 72 byte.",
    });
  }

  if (db.getUserForAuthentication(email)) {
    return res.status(409).json({
      success: false,
      message: "Email sudah terdaftar. Silakan masuk dengan akun tersebut.",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  let user;
  try {
    user = db.addUser({ name, email, password: hashedPassword });
  } catch (error) {
    if (
      error.errcode === 2067 ||
      error.message?.includes("UNIQUE constraint failed: users.email")
    ) {
      return res.status(409).json({
        success: false,
        message: "Email sudah terdaftar. Silakan masuk dengan akun tersebut.",
      });
    }
    throw error;
  }

  return res.status(201).json({
    success: true,
    message: "Akun berhasil dibuat.",
    token: createToken(user, "user"),
    user: publicUser(user),
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  const admin = db.getAdmin();

  if (!admin || email.trim().toLowerCase() !== admin.email.toLowerCase()) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  const token = createToken(admin, "admin");
  return res.json({
    success: true,
    message: "Login successful",
    token,
    user: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
    },
  });
});

router.post("/user/login", async (req, res) => {
  const email =
    typeof req.body?.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
  const password =
    typeof req.body?.password === "string" ? req.body.password : "";

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email dan kata sandi wajib diisi.",
    });
  }

  const user = db.getUserForAuthentication(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({
      success: false,
      message: "Email atau kata sandi tidak sesuai.",
    });
  }

  return res.json({
    success: true,
    message: "Berhasil masuk.",
    token: createToken(user, "user"),
    user: publicUser(user),
  });
});

router.get("/me", authenticateAdmin, (req, res) => {
  const admin = db.getAdmin();

  if (!admin) {
    return res.status(404).json({
      success: false,
      message: "Admin not found",
    });
  }

  res.json({
    success: true,
    data: {
      id: admin.id,
      email: admin.email,
      name: admin.name,
    },
  });
});

router.get("/user/me", authenticateUser, (req, res) => {
  const user = db.getUserById(req.user.sub);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Akun pengguna tidak ditemukan.",
    });
  }

  return res.json({
    success: true,
    data: publicUser(user),
  });
});

export default router;