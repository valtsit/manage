const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'data.db');

let db;

async function initDB() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'operations',
      created_at DATETIME DEFAULT (datetime('now', 'localtime'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      taobao_url TEXT,
      sku TEXT,
      category TEXT,
      supplier TEXT,
      purchase_price REAL DEFAULT 0,
      shipping_cost REAL DEFAULT 0,
      selling_price REAL DEFAULT 0,
      status TEXT DEFAULT 'draft',
      created_by INTEGER,
      created_at DATETIME DEFAULT (datetime('now', 'localtime')),
      updated_at DATETIME DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER UNIQUE NOT NULL,
      quantity INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS inventory_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      note TEXT,
      operated_by INTEGER,
      created_at DATETIME DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (operated_by) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS product_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT,
      tmall_id TEXT,
      title TEXT,
      remark TEXT,
      created_by INTEGER,
      updated_by INTEGER,
      created_at DATETIME DEFAULT (datetime('now', 'localtime')),
      updated_at DATETIME DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (updated_by) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS product_link_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      link_id INTEGER NOT NULL,
      sku_id TEXT,
      grade_spec TEXT,
      sales_weight REAL DEFAULT 0,
      total_cost REAL DEFAULT 0,
      new_price REAL DEFAULT 0,
      profit_margin REAL DEFAULT 0,
      FOREIGN KEY (link_id) REFERENCES product_links(id)
    )
  `);

  // 迁移：旧表补充列
  try { db.run('ALTER TABLE product_links ADD COLUMN url TEXT'); } catch(e) {}
  try { db.run('ALTER TABLE product_links ADD COLUMN tmall_id TEXT'); } catch(e) {}

  db.run(`
    CREATE TABLE IF NOT EXISTS raw_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      purchase_price REAL DEFAULT 0,
      loss_rate REAL DEFAULT 5,
      loss_price REAL DEFAULT 0,
      remark TEXT,
      created_by INTEGER,
      updated_by INTEGER,
      created_at DATETIME DEFAULT (datetime('now', 'localtime')),
      updated_at DATETIME DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (updated_by) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS consumables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      labor_cost REAL DEFAULT 0,
      packaging_cost REAL DEFAULT 0,
      label_cost REAL DEFAULT 0,
      remark TEXT,
      created_by INTEGER,
      updated_by INTEGER,
      created_at DATETIME DEFAULT (datetime('now', 'localtime')),
      updated_at DATETIME DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (updated_by) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS labels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop TEXT,
      variety TEXT,
      weight REAL DEFAULT 0,
      spec TEXT,
      label_type TEXT,
      bottle_size TEXT,
      label_size TEXT,
      has_inner_bag INTEGER DEFAULT 0,
      label_content TEXT,
      remark TEXT,
      is_sent INTEGER DEFAULT 0,
      sent_date TEXT,
      has_barcode INTEGER DEFAULT 0,
      thumbnail TEXT,
      created_by INTEGER,
      updated_by INTEGER,
      created_at DATETIME DEFAULT (datetime('now', 'localtime')),
      updated_at DATETIME DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (updated_by) REFERENCES users(id)
    )
  `);

  // 默认平台费率 5%
  const existing = db.exec("SELECT value FROM settings WHERE key = 'platform_fee_rate'");
  if (!existing.length) {
    db.run("INSERT INTO settings (key, value) VALUES ('platform_fee_rate', '0.05')");
  }

  // 默认管理员账号 admin/admin123
  const admin = db.exec("SELECT id FROM users WHERE username = 'admin'");
  if (!admin.length) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.run("INSERT INTO users (username, password, role) VALUES ('admin', ?, 'admin')", [hash]);
  }

  saveDB();
  return db;
}

function saveDB() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function getDB() {
  return db;
}

module.exports = { initDB, getDB, saveDB };
