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

function validEmail(email) {
  return (
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

function emailInUse(email, exceptAdminId) {
  const admin = db.getAdminByEmail(email);
  return (
    (admin && admin.id !== exceptAdminId) ||
    Boolean(db.getUserForAuthentication(email))
  );
}

function isDuplicateEmailError(error) {
  return (
    error.errcode === 2067 ||
    error.message?.includes("UNIQUE constraint failed: admins.email")
  );
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
  if (db.getAdminByEmail(email)) {
    return res.status(409).json({
      success: false,
      message: "Email sudah digunakan. Silakan masuk dengan akun tersebut.",
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

  const admin = db.getAdminByEmail(email);
  if (admin) {
    if (!(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({
        success: false,
        message: "Email atau kata sandi tidak sesuai.",
      });
    }

    return res.json({
      success: true,
      message: "Berhasil masuk.",
      token: createToken(admin, "admin"),
      role: "admin",
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
      },
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
    role: "user",
    user: publicUser(user),
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
  const admin = db.getAdminById(req.user.sub);

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
      createdAt: admin.createdAt,
    },
  });
});

router.get("/admins", authenticateAdmin, (req, res) => {
  res.json({ success: true, data: db.getAdmins() });
});

router.post("/admins", authenticateAdmin, async (req, res) => {
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
  if (!validEmail(email)) {
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
  if (emailInUse(email)) {
    return res.status(409).json({
      success: false,
      message: "Email sudah digunakan oleh akun lain.",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const admin = db.addAdmin({ name, email, password: hashedPassword });
    return res.status(201).json({
      success: true,
      message: "Admin berhasil ditambahkan.",
      data: admin,
    });
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      return res.status(409).json({
        success: false,
        message: "Email sudah digunakan oleh akun lain.",
      });
    }
    throw error;
  }
});

router.put("/admins/:id", authenticateAdmin, async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const email =
    typeof req.body?.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";
  const password =
    typeof req.body?.password === "string" ? req.body.password : "";

  if (!db.getAdminById(req.params.id)) {
    return res.status(404).json({
      success: false,
      message: "Admin tidak ditemukan.",
    });
  }
  if (name.length < 2 || name.length > 80) {
    return res.status(400).json({
      success: false,
      message: "Nama harus berisi 2 sampai 80 karakter.",
    });
  }
  if (!validEmail(email)) {
    return res.status(400).json({
      success: false,
      message: "Masukkan alamat email yang valid.",
    });
  }
  if (
    password &&
    (password.length < 8 || Buffer.byteLength(password, "utf8") > 72)
  ) {
    return res.status(400).json({
      success: false,
      message: "Kata sandi harus minimal 8 karakter dan maksimal 72 byte.",
    });
  }
  if (emailInUse(email, req.params.id)) {
    return res.status(409).json({
      success: false,
      message: "Email sudah digunakan oleh akun lain.",
    });
  }

  const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
  try {
    const admin = db.updateAdmin(req.params.id, {
      name,
      email,
      password: hashedPassword,
    });
    return res.json({
      success: true,
      message: "Data admin berhasil diperbarui.",
      data: admin,
    });
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      return res.status(409).json({
        success: false,
        message: "Email sudah digunakan oleh akun lain.",
      });
    }
    throw error;
  }
});

router.delete("/admins/:id", authenticateAdmin, (req, res) => {
  if (req.params.id === req.user.sub) {
    return res.status(403).json({
      success: false,
      message: "Anda tidak dapat menghapus akun admin yang sedang digunakan.",
    });
  }
  if (!db.getAdminById(req.params.id)) {
    return res.status(404).json({
      success: false,
      message: "Admin tidak ditemukan.",
    });
  }
  if (db.getAdminCount() <= 1) {
    return res.status(409).json({
      success: false,
      message: "Minimal harus ada satu akun administrator.",
    });
  }
  db.deleteAdmin(req.params.id);
  return res.json({
    success: true,
    message: "Admin berhasil dihapus.",
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