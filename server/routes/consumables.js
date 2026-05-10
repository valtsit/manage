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

router.get('/', (req, res) => {
  const db = getDB();
  const { keyword } = req.query;
  let sql = 'SELECT c.*, cu.username as creator_name, uu.username as updater_name FROM consumables c LEFT JOIN users cu ON c.created_by = cu.id LEFT JOIN users uu ON c.updated_by = uu.id WHERE 1=1';
  const params = [];
  if (keyword) { sql += ' AND c.name LIKE ?'; params.push(`%${keyword}%`); }
  sql += ' ORDER BY c.updated_at DESC';
  res.json(rowsToObjects(db.exec(sql, params)));
});

router.get('/:id', (req, res) => {
  const db = getDB();
  const items = rowsToObjects(db.exec('SELECT * FROM consumables WHERE id = ?', [req.params.id]));
  if (!items.length) return res.status(404).json({ error: '耗材包装不存在' });
  res.json(items[0]);
});

router.post('/', roleMiddleware('admin', 'operations'), (req, res) => {
  const { name, labor_cost, packaging_cost, label_cost, remark } = req.body;
  if (!name) return res.status(400).json({ error: '名称必填' });
  const db = getDB();
  db.run('INSERT INTO consumables (name, labor_cost, packaging_cost, label_cost, remark, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [name, labor_cost || 0, packaging_cost || 0, label_cost || 0, remark || '', req.user.id, req.user.id]);
  saveDB();
  const result = db.exec('SELECT last_insert_rowid() as id');
  res.json({ id: result[0].values[0][0], message: '创建成功' });
});

router.put('/:id', roleMiddleware('admin', 'operations'), (req, res) => {
  const { name, labor_cost, packaging_cost, label_cost, remark } = req.body;
  const db = getDB();
  if (!db.exec('SELECT id FROM consumables WHERE id = ?', [req.params.id]).length) return res.status(404).json({ error: '耗材包装不存在' });
  db.run('UPDATE consumables SET name = ?, labor_cost = ?, packaging_cost = ?, label_cost = ?, remark = ?, updated_by = ?, updated_at = datetime("now","localtime") WHERE id = ?',
    [name, labor_cost || 0, packaging_cost || 0, label_cost || 0, remark || '', req.user.id, req.params.id]);
  saveDB();
  res.json({ message: '更新成功' });
});

router.delete('/:id', roleMiddleware('admin', 'operations'), (req, res) => {
  getDB().run('DELETE FROM consumables WHERE id = ?', [req.params.id]);
  saveDB();
  res.json({ message: '删除成功' });
});

module.exports = router;
