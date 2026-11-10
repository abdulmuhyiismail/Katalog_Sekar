import "../config/env.js";
import { DatabaseSync } from "node:sqlite";
import path from "path";
import fs from "fs";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SQLITE_FILE = process.env.SQLITE_FILE
  ? path.resolve(process.env.SQLITE_FILE)
  : path.join(__dirname, "katalogwa.sqlite");
const DATA_FILE = path.join(__dirname, "data.json");

fs.mkdirSync(path.dirname(SQLITE_FILE), { recursive: true });

class SqliteDatabase {
  constructor() {
    this.db = new DatabaseSync(SQLITE_FILE);
    this.initTables();
    this.seedInitialData();
  }

  initTables() {
    // Enable foreign keys
    this.db.exec("PRAGMA foreign_keys = ON;");

    // 1. Categories Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Products Table (Relational with Foreign Key to categories)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
        price INTEGER NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        badge TEXT NOT NULL DEFAULT '',
        stock_status TEXT NOT NULL DEFAULT 'Tersedia',
        description TEXT,
        image TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const categoryColumns = this.db.prepare("PRAGMA table_info(categories)").all();
    if (!categoryColumns.some((column) => column.name === "description")) {
      this.db.exec(
        "ALTER TABLE categories ADD COLUMN description TEXT NOT NULL DEFAULT ''",
      );
    }

    const productColumns = this.db.prepare("PRAGMA table_info(products)").all();
    if (!productColumns.some((column) => column.name === "stock")) {
      this.db.exec(
        "ALTER TABLE products ADD COLUMN stock INTEGER NOT NULL DEFAULT 0",
      );
      this.db.exec(
        "UPDATE products SET stock = 1 WHERE stock_status = 'Tersedia'",
      );
    }
    if (!productColumns.some((column) => column.name === "badge")) {
      this.db.exec(
        "ALTER TABLE products ADD COLUMN badge TEXT NOT NULL DEFAULT ''",
      );
    }

    // 3. Settings Key-Value Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // 4. Admin Authentication Table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS admins (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        customer_name TEXT NOT NULL,
        delivery_method TEXT NOT NULL CHECK (delivery_method IN ('delivery', 'pickup')),
        address TEXT NOT NULL DEFAULT '',
        note TEXT NOT NULL DEFAULT '',
        items_json TEXT NOT NULL,
        subtotal INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);
    `);

    // Indexes
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_products_cat ON products(category_id);
      CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_status);
    `);
  }

  seedInitialData() {
    const seedData = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    const seedDemoData = process.env.SEED_DEMO_DATA === "true";

    // Seed Settings
    const existingSettings = this.db
      .prepare("SELECT COUNT(*) AS count FROM settings")
      .get();
    if (existingSettings.count === 0) {
      const insertSetting = this.db.prepare(
        "INSERT INTO settings (key, value) VALUES (?, ?)",
      );
      for (const [key, value] of Object.entries(seedData.settings)) {
        insertSetting.run(key, String(value));
      }
    }

    // Seed Admin
    const existingAdmin = this.db
      .prepare("SELECT COUNT(*) AS count FROM admins")
      .get();
    if (existingAdmin.count === 0) {
      const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
      const password = process.env.INITIAL_ADMIN_PASSWORD;
      if (
        !email ||
        email === "admin@example.com" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        !password ||
        password.startsWith("replace-")
      ) {
        throw new Error(
          "Set a valid INITIAL_ADMIN_EMAIL and a unique INITIAL_ADMIN_PASSWORD before starting with a new database.",
        );
      }
      if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
        throw new Error(
          "INITIAL_ADMIN_PASSWORD must be at least 8 characters and no more than 72 bytes.",
        );
      }
      const name = process.env.INITIAL_ADMIN_NAME?.trim() || "Admin Sekar";
      const hashedPassword = bcrypt.hashSync(password, 10);
      this.db
        .prepare(
          "INSERT INTO admins (id, name, email, password) VALUES (?, ?, ?, ?)",
        )
        .run(
          randomUUID(),
          name,
          email,
          hashedPassword,
        );
    }

    // Seed Categories
    const existingCategories = this.db
      .prepare("SELECT COUNT(*) AS count FROM categories")
      .get();
    if (seedDemoData && existingCategories.count === 0) {
      const insertCat = this.db.prepare(
        "INSERT INTO categories (id, name, slug, description) VALUES (?, ?, ?, ?)",
      );
      for (const category of seedData.categories) {
        insertCat.run(
          category.id,
          category.name,
          category.slug,
          category.description || "",
        );
      }
    }

    // Seed Products
    const existingProducts = this.db
      .prepare("SELECT COUNT(*) AS count FROM products")
      .get();
    if (seedDemoData && existingProducts.count === 0) {
      const insertProduct = this.db.prepare(`
        INSERT INTO products (id, name, category_id, price, stock, badge, stock_status, description, image)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const product of seedDemoData ? seedData.products : []) {
        const stock = Number(product.stock) || 0;
        const stockStatus = stock > 0 ? "Tersedia" : "Habis";
        insertProduct.run(
          product.id,
          product.name,
          product.categoryId,
          product.price,
          stock,
          product.badge || "",
          stockStatus,
          product.description,
          product.image,
        );
      }
    }

    const updateSeedBadge = this.db.prepare(
      "UPDATE products SET badge = ? WHERE id = ? AND name = ? AND badge = ''",
    );
    for (const product of seedData.products) {
      if (product.badge) {
        updateSeedBadge.run(product.badge, product.id, product.name);
      }
    }
  }

  // --- Settings SQL Operations ---
  getSettings() {
    const rows = this.db.prepare("SELECT key, value FROM settings").all();
    const settings = {};
    for (const row of rows) {
      settings[row.key] = row.value;
    }
    return settings;
  }

  updateSettings(newSettings) {
    const upsert = this.db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);

    for (const [key, val] of Object.entries(newSettings)) {
      upsert.run(key, String(val));
    }
    return this.getSettings();
  }

  getStoreSettings() {
    const settings = this.getSettings();
    return {
      storeName: settings.storeName || "Sekar",
      tagline: settings.tagline || "",
      address: settings.address || "",
      phone: settings.phone || "",
      currency: settings.currency || "Rp",
      activeWhatsApp: settings.activeWhatsApp !== "false",
    };
  }

  updateStoreSettings(newSettings) {
    const current = this.getStoreSettings();
    const next = {
      storeName: newSettings.storeName ?? current.storeName,
      tagline: newSettings.tagline ?? current.tagline,
      address: newSettings.address ?? current.address,
      phone: newSettings.phone ?? current.phone,
      currency: newSettings.currency ?? current.currency,
      activeWhatsApp: newSettings.activeWhatsApp ?? current.activeWhatsApp,
    };
    this.updateSettings(next);
    return this.getStoreSettings();
  }

  // --- Admin SQL Operations ---
  getAdminByEmail(email) {
    return this.db
      .prepare(
        "SELECT id, name, email, password FROM admins WHERE LOWER(email) = ?",
      )
      .get(email);
  }

  getAdminById(id) {
    return this.db
      .prepare(
        "SELECT id, name, email, created_at AS createdAt FROM admins WHERE id = ?",
      )
      .get(id);
  }

  getAdmins() {
    return this.db
      .prepare(
        "SELECT id, name, email, created_at AS createdAt FROM admins ORDER BY created_at ASC, name COLLATE NOCASE ASC",
      )
      .all();
  }

  getAdminCount() {
    return this.db.prepare("SELECT COUNT(*) AS count FROM admins").get().count;
  }

  addAdmin({ name, email, password }) {
    const id = randomUUID();
    this.db
      .prepare(
        "INSERT INTO admins (id, name, email, password) VALUES (?, ?, ?, ?)",
      )
      .run(id, name, email, password);
    return this.getAdminById(id);
  }

  updateAdmin(id, { name, email, password }) {
    const result = this.db
      .prepare(
        "UPDATE admins SET name = ?, email = ?, password = COALESCE(?, password) WHERE id = ?",
      )
      .run(name, email, password ?? null, id);
    return result.changes > 0 ? this.getAdminById(id) : null;
  }

  deleteAdmin(id) {
    const result = this.db.prepare("DELETE FROM admins WHERE id = ?").run(id);
    return result.changes > 0;
  }

  getUserForAuthentication(email) {
    return this.db
      .prepare("SELECT id, name, email, password FROM users WHERE email = ?")
      .get(email);
  }

  getUserById(id) {
    return this.db
      .prepare(
        "SELECT id, name, email, created_at AS createdAt FROM users WHERE id = ?",
      )
      .get(id);
  }

  addUser({ name, email, password }) {
    const id = randomUUID();
    this.db
      .prepare(
        "INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)",
      )
      .run(id, name, email, password);
    return this.getUserById(id);
  }

  createOrder({ userId, customerName, deliveryMethod, address, note, items, subtotal }) {
    const id = randomUUID();
    this.db
      .prepare(`
        INSERT INTO orders (
          id, user_id, customer_name, delivery_method, address, note, items_json, subtotal
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        id,
        userId,
        customerName,
        deliveryMethod,
        address,
        note,
        JSON.stringify(items),
        subtotal,
      );
    return this.getOrderById(id);
  }

  getOrderById(id) {
    const order = this.db.prepare(`
      SELECT
        o.id, o.user_id AS userId, o.customer_name AS customerName,
        u.email AS customerEmail, o.delivery_method AS deliveryMethod,
        o.address, o.note, o.items_json AS itemsJson, o.subtotal, o.status,
        o.created_at AS createdAt, o.updated_at AS updatedAt
      FROM orders o
      JOIN users u ON u.id = o.user_id
      WHERE o.id = ?
    `).get(id);
    return order ? { ...order, items: JSON.parse(order.itemsJson) } : null;
  }

  getOrdersByUser(userId) {
    return this.db.prepare(`
      SELECT
        o.id, o.user_id AS userId, o.customer_name AS customerName,
        u.email AS customerEmail, o.delivery_method AS deliveryMethod,
        o.address, o.note, o.items_json AS itemsJson, o.subtotal, o.status,
        o.created_at AS createdAt, o.updated_at AS updatedAt
      FROM orders o
      JOIN users u ON u.id = o.user_id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC, o.id DESC
    `).all(userId).map((order) => ({ ...order, items: JSON.parse(order.itemsJson) }));
  }

  getOrders() {
    return this.db.prepare(`
      SELECT
        o.id, o.user_id AS userId, o.customer_name AS customerName,
        u.email AS customerEmail, o.delivery_method AS deliveryMethod,
        o.address, o.note, o.items_json AS itemsJson, o.subtotal, o.status,
        o.created_at AS createdAt, o.updated_at AS updatedAt
      FROM orders o
      JOIN users u ON u.id = o.user_id
      ORDER BY o.created_at DESC, o.id DESC
    `).all().map((order) => ({ ...order, items: JSON.parse(order.itemsJson) }));
  }

  updateOrderStatus(id, status) {
    const result = this.db.prepare(`
      UPDATE orders
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND status = 'pending'
    `).run(status, id);
    return result.changes ? this.getOrderById(id) : null;
  }

  // --- Category SQL Operations ---
  getCategories() {
    // Relational SQL query with LEFT JOIN and COUNT
    return this.db
      .prepare(
        `
      SELECT 
        c.id, 
        c.name, 
        c.slug, 
        c.description,
        c.created_at AS createdAt,
        COUNT(p.id) AS productCount
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id
      ORDER BY c.created_at ASC
    `,
      )
      .all();
  }

  getCategoryById(id) {
    return this.db
      .prepare(
        "SELECT id, name, slug, description FROM categories WHERE id = ?",
      )
      .get(id);
  }

  addCategory(name, description = "") {
    const id = `cat-${Date.now()}`;
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    this.db
      .prepare(
        "INSERT INTO categories (id, name, slug, description) VALUES (?, ?, ?, ?)",
      )
      .run(id, name, slug, description);
    return { id, name, slug, description, productCount: 0 };
  }

  updateCategory(id, name, description) {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const res = this.db
      .prepare(
        "UPDATE categories SET name = ?, slug = ?, description = COALESCE(?, description) WHERE id = ?",
      )
      .run(name, slug, description ?? null, id);
    if (res.changes === 0) return null;
    return this.getCategoryById(id);
  }

  deleteCategory(id) {
    const res = this.db.prepare("DELETE FROM categories WHERE id = ?").run(id);
    return res.changes > 0;
  }

  // --- Product SQL Operations ---
  getProducts(filters = {}) {
    let sql = `
      SELECT 
        p.id, 
        p.name, 
        p.category_id AS categoryId, 
        c.name AS categoryName, 
        p.price, 
        p.stock,
        p.badge,
        p.stock_status AS stockStatus, 
        p.description, 
        p.image, 
        p.created_at AS createdAt,
        p.updated_at AS updatedAt
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.categoryId) {
      sql += " AND p.category_id = ?";
      params.push(filters.categoryId);
    }

    if (filters.stockStatus) {
      sql += " AND p.stock_status = ?";
      params.push(filters.stockStatus);
    }

    if (filters.search) {
      sql += " AND (LOWER(p.name) LIKE ? OR LOWER(p.description) LIKE ?)";
      const queryPattern = `%${filters.search.toLowerCase()}%`;
      params.push(queryPattern, queryPattern);
    }

    sql += " ORDER BY p.created_at DESC, p.id ASC";

    return this.db.prepare(sql).all(...params);
  }

  getProductById(id) {
    return this.db
      .prepare(
        `
      SELECT 
        p.id, 
        p.name, 
        p.category_id AS categoryId, 
        c.name AS categoryName, 
        p.price, 
        p.stock,
        p.badge,
        p.stock_status AS stockStatus, 
        p.description, 
        p.image, 
        p.created_at AS createdAt,
        p.updated_at AS updatedAt
      FROM products p
      JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `,
      )
      .get(id);
  }

  addProduct(productData) {
    const id = `prod-${Date.now()}`;
    const price = Number(productData.price) || 0;
    const stock = Math.max(0, Number(productData.stock) || 0);
    const badge = productData.badge || "";
    const stockStatus = stock > 0 ? "Tersedia" : "Habis";
    const description = productData.description || "";
    const image =
      productData.image ||
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80";

    this.db
      .prepare(
        `
      INSERT INTO products (id, name, category_id, price, stock, badge, stock_status, description, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      )
      .run(
        id,
        productData.name,
        productData.categoryId,
        price,
        stock,
        badge,
        stockStatus,
        description,
        image,
      );

    return this.getProductById(id);
  }

  updateProduct(id, productData) {
    const current = this.getProductById(id);
    if (!current) return null;

    const name =
      productData.name !== undefined ? productData.name : current.name;
    const categoryId =
      productData.categoryId !== undefined
        ? productData.categoryId
        : current.categoryId;
    const price =
      productData.price !== undefined
        ? Number(productData.price)
        : current.price;
    const stock =
      productData.stock !== undefined
        ? Math.max(0, Number(productData.stock) || 0)
        : current.stock;
    const badge = productData.badge !== undefined ? productData.badge : current.badge;
    const stockStatus =
      productData.stock !== undefined
        ? stock > 0
          ? "Tersedia"
          : "Habis"
        : productData.stockStatus !== undefined
        ? productData.stockStatus
        : current.stockStatus;
    const description =
      productData.description !== undefined
        ? productData.description
        : current.description;
    const image =
      productData.image !== undefined ? productData.image : current.image;

    this.db
      .prepare(
        `
      UPDATE products 
      SET name = ?, category_id = ?, price = ?, stock = ?, badge = ?, stock_status = ?, description = ?, image = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      )
      .run(name, categoryId, price, stock, badge, stockStatus, description, image, id);

    return this.getProductById(id);
  }

  toggleStock(id) {
    const product = this.getProductById(id);
    if (!product) return null;

    const newStock = product.stock > 0 ? 0 : 1;
    const stockStatus = newStock > 0 ? "Tersedia" : "Habis";
    this.db
      .prepare(
        `
      UPDATE products 
      SET stock = ?, stock_status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `,
      )
      .run(newStock, stockStatus, id);

    return this.getProductById(id);
  }

  deleteProduct(id) {
    const res = this.db.prepare("DELETE FROM products WHERE id = ?").run(id);
    return res.changes > 0;
  }
}

export const db = new SqliteDatabase();