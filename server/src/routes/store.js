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

router.put(`/`, authenticateAdmin, (req, res) => {
  const { storeName, tagline, address, phone, currency, activeWhatsApp } =
    req.body;
  const updated = db.updateStoreSettings({
    ...(storeName !== undefined && { storeName: storeName.trim() }),
    ...(tagline !== undefined && { tagline: tagline.trim() }),
    ...(address !== undefined && { address: address.trim() }),
    ...(phone !== undefined && { phone: phone.replace(/\D/g, "") }),
    ...(currency !== undefined && { currency: currency.trim() }),
    ...(activeWhatsApp !== undefined && { activeWhatsApp }),
  });

  res.json({
    success: true,
    data: updated,
    message: "Store settings updated successfully",
  });
});

export default router;