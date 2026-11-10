import express from "express";
import { db } from "../db/db.js";
import { authenticateAdmin, authenticateUser } from "../middleware/auth.js";

const router = express.Router();

router.post("/", authenticateUser, (req, res) => {
  const user = db.getUserById(req.user.sub);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Sesi pengguna tidak berlaku. Silakan masuk kembali.",
    });
  }

  const customerName =
    typeof req.body?.customerName === "string" ? req.body.customerName.trim() : "";
  const deliveryMethod = req.body?.deliveryMethod;
  const address = typeof req.body?.address === "string" ? req.body.address.trim() : "";
  const note = typeof req.body?.note === "string" ? req.body.note.trim() : "";
  const requestedItems = req.body?.items;

  if (customerName.length < 2 || customerName.length > 80) {
    return res.status(400).json({
      success: false,
      message: "Nama pemesan harus berisi 2 sampai 80 karakter.",
    });
  }
  if (deliveryMethod !== "delivery" && deliveryMethod !== "pickup") {
    return res.status(400).json({
      success: false,
      message: "Pilih metode kirim ke alamat atau ambil di studio.",
    });
  }
  if (deliveryMethod === "delivery" && (!address || address.length > 500)) {
    return res.status(400).json({
      success: false,
      message: "Alamat pengiriman wajib diisi dan maksimal 500 karakter.",
    });
  }
  if (deliveryMethod === "pickup" && address.length > 500) {
    return res.status(400).json({
      success: false,
      message: "Alamat maksimal 500 karakter.",
    });
  }
  if (note.length > 500) {
    return res.status(400).json({
      success: false,
      message: "Catatan pesanan maksimal 500 karakter.",
    });
  }
  if (!Array.isArray(requestedItems) || requestedItems.length < 1 || requestedItems.length > 30) {
    return res.status(400).json({
      success: false,
      message: "Pesanan harus berisi 1 sampai 30 produk.",
    });
  }

  const quantities = new Map();
  for (const item of requestedItems) {
    if (
      !item ||
      typeof item.productId !== "string" ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 99
    ) {
      return res.status(400).json({
        success: false,
        message: "Rincian produk atau jumlah pesanan tidak valid.",
      });
    }
    quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
  }

  const items = [];
  let subtotal = 0;
  for (const [productId, quantity] of quantities) {
    const product = db.getProductById(productId);
    if (!product) {
      return res.status(400).json({
        success: false,
        message: "Salah satu produk pesanan tidak ditemukan.",
      });
    }
    if (Number(product.stock) < quantity || product.stockStatus === "Habis") {
      return res.status(409).json({
        success: false,
        message: `Stok ${product.name} tidak mencukupi.`,
      });
    }
    const unitPrice = Number(product.price);
    const lineTotal = unitPrice * quantity;
    if (!Number.isSafeInteger(lineTotal) || !Number.isSafeInteger(subtotal + lineTotal)) {
      return res.status(400).json({
        success: false,
        message: "Total pesanan tidak valid.",
      });
    }
    subtotal += lineTotal;
    items.push({
      productId: product.id,
      name: product.name,
      categoryName: product.categoryName,
      quantity,
      unitPrice,
      lineTotal,
    });
  }

  const storeAddress = db.getStoreSettings().address;
  const order = db.createOrder({
    userId: user.id,
    customerName,
    deliveryMethod,
    address: deliveryMethod === "pickup" ? storeAddress : address,
    note,
    items,
    subtotal,
  });

  return res.status(201).json({
    success: true,
    message: "Pesanan tersimpan dan menunggu konfirmasi toko.",
    data: order,
  });
});

router.get("/mine", authenticateUser, (req, res) => {
  if (!db.getUserById(req.user.sub)) {
    return res.status(401).json({
      success: false,
      message: "Sesi pengguna tidak berlaku. Silakan masuk kembali.",
    });
  }
  return res.json({ success: true, data: db.getOrdersByUser(req.user.sub) });
});

router.get("/", authenticateAdmin, (req, res) => {
  return res.json({ success: true, data: db.getOrders() });
});

router.patch("/:id/status", authenticateAdmin, (req, res) => {
  const { status } = req.body || {};
  if (status !== "confirmed" && status !== "rejected") {
    return res.status(400).json({
      success: false,
      message: "Status pesanan harus dikonfirmasi atau ditolak.",
    });
  }

  const existing = db.getOrderById(req.params.id);
  if (!existing) {
    return res.status(404).json({
      success: false,
      message: "Pesanan tidak ditemukan.",
    });
  }
  if (existing.status !== "pending") {
    return res.status(409).json({
      success: false,
      message: "Pesanan ini sudah diproses sebelumnya.",
    });
  }

  const order = db.updateOrderStatus(req.params.id, status);
  if (!order) {
    return res.status(409).json({
      success: false,
      message: "Status pesanan baru saja diperbarui oleh admin lain.",
    });
  }
  return res.json({
    success: true,
    message: status === "confirmed" ? "Pesanan dikonfirmasi." : "Pesanan ditolak.",
    data: order,
  });
});

export default router;
