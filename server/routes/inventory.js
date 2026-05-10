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

// 获取库存列表
router.get('/', (req, res) => {
  const db = getDB();
  const result = db.exec(`
    SELECT i.*, p.name, p.sku, p.category
    FROM inventory i
    JOIN products p ON i.product_id = p.id
    ORDER BY i.updated_at DESC
  `);
  res.json(rowsToObjects(result));
});

// 入库/出库操作
router.post('/operate', roleMiddleware('admin', 'warehouse'), (req, res) => {
  const { product_id, type, quantity, note } = req.body;
  if (!product_id || !type || !quantity) {
    return res.status(400).json({ error: '请填写完整信息' });
  }
  if (!['inbound', 'outbound'].includes(type)) {
    return res.status(400).json({ error: '操作类型错误' });
  }
  if (quantity <= 0) {
    return res.status(400).json({ error: '数量必须大于0' });
  }

  const db = getDB();

  // 检查商品是否存在
  const product = db.exec('SELECT id FROM products WHERE id = ?', [product_id]);
  if (!product.length) return res.status(404).json({ error: '商品不存在' });

  // 检查出库库存是否足够
  if (type === 'outbound') {
    const inv = db.exec('SELECT quantity FROM inventory WHERE product_id = ?', [product_id]);
    const currentQty = inv.length ? inv[0].values[0][0] : 0;
    if (currentQty < quantity) {
      return res.status(400).json({ error: `库存不足，当前库存: ${currentQty}` });
    }
  }

  // 记录出入库
  db.run(
    'INSERT INTO inventory_records (product_id, type, quantity, note, operated_by) VALUES (?, ?, ?, ?, ?)',
    [product_id, type, quantity, note || '', req.user.id]
  );

  // 更新库存
  const existing = db.exec('SELECT id, quantity FROM inventory WHERE product_id = ?', [product_id]);
  if (existing.length) {
    const currentQty = existing[0].values[0][1];
    const newQty = type === 'inbound' ? currentQty + quantity : currentQty - quantity;
    db.run('UPDATE inventory SET quantity = ?, updated_at = datetime("now", "localtime") WHERE product_id = ?', [newQty, product_id]);
  } else {
    if (type === 'outbound') {
      return res.status(400).json({ error: '库存为0，无法出库' });
    }
    db.run('INSERT INTO inventory (product_id, quantity) VALUES (?, ?)', [product_id, quantity]);
  }

  saveDB();
  res.json({ message: type === 'inbound' ? '入库成功' : '出库成功' });
});

// 获取出入库记录
router.get('/records', (req, res) => {
  const db = getDB();
  const { product_id, type, limit } = req.query;
  let sql = `
    SELECT ir.*, p.name as product_name, p.sku, u.username as operator_name
    FROM inventory_records ir
    JOIN products p ON ir.product_id = p.id
    LEFT JOIN users u ON ir.operated_by = u.id
    WHERE 1=1
  `;
  const params = [];
  if (product_id) { sql += ' AND ir.product_id = ?'; params.push(product_id); }
  if (type) { sql += ' AND ir.type = ?'; params.push(type); }
  sql += ' ORDER BY ir.created_at DESC';
  if (limit) { sql += ' LIMIT ?'; params.push(parseInt(limit)); }

  const result = db.exec(sql, params);
  res.json(rowsToObjects(result));
});

module.exports = router;
