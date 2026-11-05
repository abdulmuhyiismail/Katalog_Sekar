import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import authRoutes from "./routes/auth.js";
import categoryRoutes from "./routes/categories.js";
import productRoutes from "./routes/products.js";
import storeRoutes from "./routes/store.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsPath = path.join(__dirname, "../uploads");
app.use("/uploads", express.static(uploadsPath));

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/store", storeRoutes);

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
      categories: "/api/categories",
      products: "/api/products",
      store: "/api/store",
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

app.listen(port, () => {
  console.log(`KatalogWa API Server running on http://localhost:${port}`);
});