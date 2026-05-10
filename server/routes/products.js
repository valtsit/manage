const express = require('express');
const { getDB, saveDB } = require('../db');
const { roleMiddleware } = require('../middleware/auth');

const router = express.Router();

function rowsToObjects(result) {
  if (!result.length || !result[0].values.length) return [];
  const cols = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

// 获取商品列表
router.get('/', (req, res) => {
  const db = getDB();
  const { status, keyword, category } = req.query;
  let sql = 'SELECT p.*, u.username as creator_name FROM products p LEFT JOIN users u ON p.created_by = u.id WHERE 1=1';
  const params = [];

  if (status) { sql += ' AND p.status = ?'; params.push(status); }
  if (keyword) { sql += ' AND (p.name LIKE ? OR p.sku LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }
  if (category) { sql += ' AND p.category = ?'; params.push(category); }

  sql += ' ORDER BY p.updated_at DESC';
  const result = db.exec(sql, params);
  res.json(rowsToObjects(result));
});

// 获取单个商品
router.get('/:id', (req, res) => {
  const db = getDB();
  const result = db.exec('SELECT * FROM products WHERE id = ?', [req.params.id]);
  const items = rowsToObjects(result);
  if (!items.length) return res.status(404).json({ error: '商品不存在' });
  res.json(items[0]);
});

// 新增商品
router.post('/', roleMiddleware('admin', 'operations'), (req, res) => {
  const { name, taobao_url, sku, category, supplier, purchase_price, shipping_cost, selling_price, status } = req.body;
  if (!name) return res.status(400).json({ error: '商品名称必填' });

  const db = getDB();
  db.run(
    'INSERT INTO products (name, taobao_url, sku, category, supplier, purchase_price, shipping_cost, selling_price, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name, taobao_url || '', sku || '', category || '', supplier || '', purchase_price || 0, shipping_cost || 0, selling_price || 0, status || 'draft', req.user.id]
  );
  saveDB();

  const result = db.exec('SELECT last_insert_rowid() as id');
  const id = result[0].values[0][0];
  res.json({ id, message: '创建成功' });
});

// 更新商品
router.put('/:id', roleMiddleware('admin', 'operations', 'finance'), (req, res) => {
  const { name, taobao_url, sku, category, supplier, purchase_price, shipping_cost, selling_price, status } = req.body;
  const db = getDB();

  const exists = db.exec('SELECT id FROM products WHERE id = ?', [req.params.id]);
  if (!exists.length) return res.status(404).json({ error: '商品不存在' });

  // finance 只能改价格字段
  if (req.user.role === 'finance') {
    db.run(
      'UPDATE products SET purchase_price = ?, shipping_cost = ?, selling_price = ?, updated_at = datetime("now", "localtime") WHERE id = ?',
      [purchase_price || 0, shipping_cost || 0, selling_price || 0, req.params.id]
    );
  } else {
    db.run(
      'UPDATE products SET name = ?, taobao_url = ?, sku = ?, category = ?, supplier = ?, purchase_price = ?, shipping_cost = ?, selling_price = ?, status = ?, updated_at = datetime("now", "localtime") WHERE id = ?',
      [name, taobao_url || '', sku || '', category || '', supplier || '', purchase_price || 0, shipping_cost || 0, selling_price || 0, status || 'draft', req.params.id]
    );
  }
  saveDB();
  res.json({ message: '更新成功' });
});

// 删除商品
router.delete('/:id', roleMiddleware('admin', 'operations'), (req, res) => {
  const db = getDB();
  db.run('DELETE FROM inventory_records WHERE product_id = ?', [req.params.id]);
  db.run('DELETE FROM inventory WHERE product_id = ?', [req.params.id]);
  db.run('DELETE FROM products WHERE id = ?', [req.params.id]);
  saveDB();
  res.json({ message: '删除成功' });
});

// 获取所有分类
router.get('/meta/categories', (req, res) => {
  const db = getDB();
  const result = db.exec("SELECT DISTINCT category FROM products WHERE category != '' ORDER BY category");
  const categories = result.length ? result[0].values.map(r => r[0]) : [];
  res.json(categories);
});

module.exports = router;
