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
  let sql = 'SELECT l.*, cu.username as creator_name, uu.username as updater_name FROM labels l LEFT JOIN users cu ON l.created_by = cu.id LEFT JOIN users uu ON l.updated_by = uu.id WHERE 1=1';
  const params = [];
  if (keyword) { sql += ' AND (l.shop LIKE ? OR l.variety LIKE ? OR l.spec LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`); }
  sql += ' ORDER BY l.updated_at DESC';
  res.json(rowsToObjects(db.exec(sql, params)));
});

router.get('/:id', (req, res) => {
  const db = getDB();
  const items = rowsToObjects(db.exec('SELECT * FROM labels WHERE id = ?', [req.params.id]));
  if (!items.length) return res.status(404).json({ error: '标签不存在' });
  res.json(items[0]);
});

router.post('/', roleMiddleware('admin', 'operations'), (req, res) => {
  const { shop, variety, weight, spec, label_type, bottle_size, label_size, has_inner_bag, label_content, remark, is_sent, sent_date, has_barcode, thumbnail } = req.body;
  const db = getDB();
  db.run('INSERT INTO labels (shop, variety, weight, spec, label_type, bottle_size, label_size, has_inner_bag, label_content, remark, is_sent, sent_date, has_barcode, thumbnail, created_by, updated_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
    [shop||'', variety||'', weight||0, spec||'', label_type||'', bottle_size||'', label_size||'', has_inner_bag?1:0, label_content||'', remark||'', is_sent?1:0, sent_date||'', has_barcode?1:0, thumbnail||'', req.user.id, req.user.id]);
  saveDB();
  const result = db.exec('SELECT last_insert_rowid() as id');
  res.json({ id: result[0].values[0][0], message: '创建成功' });
});

router.put('/:id', roleMiddleware('admin', 'operations'), (req, res) => {
  const { shop, variety, weight, spec, label_type, bottle_size, label_size, has_inner_bag, label_content, remark, is_sent, sent_date, has_barcode, thumbnail } = req.body;
  const db = getDB();
  if (!db.exec('SELECT id FROM labels WHERE id = ?', [req.params.id]).length) return res.status(404).json({ error: '标签不存在' });
  db.run('UPDATE labels SET shop=?, variety=?, weight=?, spec=?, label_type=?, bottle_size=?, label_size=?, has_inner_bag=?, label_content=?, remark=?, is_sent=?, sent_date=?, has_barcode=?, thumbnail=?, updated_by=?, updated_at=datetime("now","localtime") WHERE id=?',
    [shop||'', variety||'', weight||0, spec||'', label_type||'', bottle_size||'', label_size||'', has_inner_bag?1:0, label_content||'', remark||'', is_sent?1:0, sent_date||'', has_barcode?1:0, thumbnail||'', req.user.id, req.params.id]);
  saveDB();
  res.json({ message: '更新成功' });
});

router.delete('/:id', roleMiddleware('admin', 'operations'), (req, res) => {
  getDB().run('DELETE FROM labels WHERE id = ?', [req.params.id]);
  saveDB();
  res.json({ message: '删除成功' });
});

module.exports = router;
