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

// 获取商品链接列表
router.get('/', (req, res) => {
  const db = getDB();
  const { keyword } = req.query;
  let sql = 'SELECT pl.*, cu.username as creator_name, uu.username as updater_name FROM product_links pl LEFT JOIN users cu ON pl.created_by = cu.id LEFT JOIN users uu ON pl.updated_by = uu.id WHERE 1=1';
  const params = [];

  if (keyword) { sql += ' AND (pl.name LIKE ? OR pl.title LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }
  sql += ' ORDER BY pl.updated_at DESC';

  const result = db.exec(sql, params);
  const links = rowsToObjects(result);

  // 附带子项
  links.forEach(link => {
    const itemResult = db.exec('SELECT * FROM product_link_items WHERE link_id = ?', [link.id]);
    link.items = rowsToObjects(itemResult);
  });

  res.json(links);
});

// 获取单个商品链接
router.get('/:id', (req, res) => {
  const db = getDB();
  const result = db.exec('SELECT pl.*, cu.username as creator_name, uu.username as updater_name FROM product_links pl LEFT JOIN users cu ON pl.created_by = cu.id LEFT JOIN users uu ON pl.updated_by = uu.id WHERE pl.id = ?', [req.params.id]);
  const links = rowsToObjects(result);
  if (!links.length) return res.status(404).json({ error: '商品链接不存在' });

  const link = links[0];
  const itemResult = db.exec('SELECT * FROM product_link_items WHERE link_id = ?', [link.id]);
  link.items = rowsToObjects(itemResult);

  res.json(link);
});

// 新增商品链接
router.post('/', roleMiddleware('admin', 'operations'), (req, res) => {
  const { name, tmall_id, title, remark, items } = req.body;
  if (!name) return res.status(400).json({ error: '商品名称必填' });

  const db = getDB();
  db.run(
    'INSERT INTO product_links (name, tmall_id, title, remark, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?)',
    [name, tmall_id || '', title || '', remark || '', req.user.id, req.user.id]
  );

  const result = db.exec('SELECT last_insert_rowid() as id');
  const id = result[0].values[0][0];

  if (Array.isArray(items) && items.length) {
    items.forEach(item => {
      db.run(
        'INSERT INTO product_link_items (link_id, sku_id, grade_spec, sales_weight, total_cost, new_price, profit_margin) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, item.sku_id || '', item.grade_spec || '', item.sales_weight || 0, item.total_cost || 0, item.new_price || 0, item.profit_margin || 0]
      );
    });
  }

  saveDB();
  res.json({ id, message: '创建成功' });
});

// 更新商品链接
router.put('/:id', roleMiddleware('admin', 'operations'), (req, res) => {
  const { name, tmall_id, title, remark, items } = req.body;
  const db = getDB();

  const exists = db.exec('SELECT id FROM product_links WHERE id = ?', [req.params.id]);
  if (!exists.length) return res.status(404).json({ error: '商品链接不存在' });

  db.run(
    'UPDATE product_links SET name = ?, tmall_id = ?, title = ?, remark = ?, updated_by = ?, updated_at = datetime("now", "localtime") WHERE id = ?',
    [name, tmall_id || '', title || '', remark || '', req.user.id, req.params.id]
  );

  // 删除旧子项，重新插入
  db.run('DELETE FROM product_link_items WHERE link_id = ?', [req.params.id]);
  if (Array.isArray(items) && items.length) {
    items.forEach(item => {
      db.run(
        'INSERT INTO product_link_items (link_id, sku_id, grade_spec, sales_weight, total_cost, new_price, profit_margin) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [req.params.id, item.sku_id || '', item.grade_spec || '', item.sales_weight || 0, item.total_cost || 0, item.new_price || 0, item.profit_margin || 0]
      );
    });
  }

  saveDB();
  res.json({ message: '更新成功' });
});

// 删除商品链接
router.delete('/:id', roleMiddleware('admin', 'operations'), (req, res) => {
  const db = getDB();
  db.run('DELETE FROM product_link_items WHERE link_id = ?', [req.params.id]);
  db.run('DELETE FROM product_links WHERE id = ?', [req.params.id]);
  saveDB();
  res.json({ message: '删除成功' });
});

module.exports = router;
