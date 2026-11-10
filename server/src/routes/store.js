import express from "express";
import { db } from "../db/db.js";
import { authenticateAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get(`/`, (req, res) => {
  const settings = db.getStoreSettings();
  res.json({
    success: true,
    data: settings,
  });
});

router.put("/", authenticateAdmin, (req, res) => {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return res.status(400).json({
      success: false,
      message: "Data pengaturan toko tidak valid.",
    });
  }

  const settings = {};
  for (const [field, maxLength] of [
    ["storeName", 80],
    ["tagline", 160],
    ["address", 240],
    ["currency", 8],
  ]) {
    if (body[field] === undefined) continue;
    if (typeof body[field] !== "string") {
      return res.status(400).json({
        success: false,
        message: `Kolom ${field} harus berupa teks.`,
      });
    }
    const value = body[field].trim();
    if (value.length > maxLength || (field === "storeName" && !value)) {
      return res.status(400).json({
        success: false,
        message:
          field === "storeName"
            ? "Nama toko wajib diisi dan maksimal 80 karakter."
            : `Kolom ${field} maksimal ${maxLength} karakter.`,
      });
    }
    settings[field] = value;
  }

  if (body.phone !== undefined) {
    if (
      typeof body.phone !== "string" ||
      !/^[+\d\s().-]*$/.test(body.phone)
    ) {
      return res.status(400).json({
        success: false,
        message: "Nomor WhatsApp hanya boleh berisi angka dan format nomor telepon.",
      });
    }
    const phone = body.phone.replace(/\D/g, "");
    if (phone && (phone.length < 9 || phone.length > 15)) {
      return res.status(400).json({
        success: false,
        message: "Nomor WhatsApp harus berisi 9 sampai 15 digit.",
      });
    }
    settings.phone = phone;
  }

  if (body.activeWhatsApp !== undefined) {
    if (typeof body.activeWhatsApp !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Status WhatsApp harus berupa aktif atau nonaktif.",
      });
    }
    settings.activeWhatsApp = body.activeWhatsApp;
  }

  if (!Object.keys(settings).length) {
    return res.status(400).json({
      success: false,
      message: "Tidak ada pengaturan yang diperbarui.",
    });
  }

  const updated = db.updateStoreSettings(settings);

  res.json({
    success: true,
    data: updated,
    message: "Pengaturan toko berhasil diperbarui.",
  });
});

export default router;