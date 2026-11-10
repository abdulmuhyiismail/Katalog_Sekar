import "./config/env.js";
import cors from "cors";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import authRoutes from "./routes/auth.js";
import categoryRoutes from "./routes/categories.js";
import productRoutes from "./routes/products.js";
import storeRoutes from "./routes/store.js";
import orderRoutes from "./routes/orders.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 5000;

if (process.env.CORS_ORIGIN) {
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsPath = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(__dirname, "../uploads");
app.use("/uploads", express.static(uploadsPath));

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/store", storeRoutes);
app.use("/api/orders", orderRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "KatalogWa API Server",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Sekar API Server",
    endpoints: {
      auth: "/api/auth/login",
      admins: {
        list: "GET /api/auth/admins",
        create: "POST /api/auth/admins",
        update: "PUT /api/auth/admins/:id",
        remove: "DELETE /api/auth/admins/:id",
      },
      categories: "/api/categories",
      products: "/api/products",
      store: "/api/store",
      orders: {
        create: "POST /api/orders (user)",
        mine: "GET /api/orders/mine (user)",
        list: "GET /api/orders (admin)",
        updateStatus: "PATCH /api/orders/:id/status (admin)",
      },
      health: "/api/health",
    },
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.status || error.statusCode || 500;
  res.status(status).json({
    success: false,
    message: status >= 500 ? "Terjadi kesalahan pada server." : error.message,
  });
});

app.listen(port, "127.0.0.1", () => {
  console.log(`KatalogWa API Server running on http://127.0.0.1:${port}`);
});