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

// 获取平台费率设置
router.get('/settings', (req, res) => {
  const db = getDB();
  const result = db.exec("SELECT value FROM settings WHERE key = 'platform_fee_rate'");
  const rate = result.length ? parseFloat(result[0].values[0][0]) : 0.05;
  res.json({ platform_fee_rate: rate });
});

// 更新平台费率
router.put('/settings', roleMiddleware('admin', 'finance'), (req, res) => {
  const { platform_fee_rate } = req.body;
  if (platform_fee_rate === undefined || platform_fee_rate < 0 || platform_fee_rate >= 1) {
    return res.status(400).json({ error: '费率必须在 0-1 之间' });
  }
  const db = getDB();
  db.run("UPDATE settings SET value = ? WHERE key = 'platform_fee_rate'", [String(platform_fee_rate)]);
  saveDB();
  res.json({ message: '更新成功' });
});

// 获取所有商品的成本分析
router.get('/analysis', (req, res) => {
  const db = getDB();
  const feeResult = db.exec("SELECT value FROM settings WHERE key = 'platform_fee_rate'");
  const feeRate = feeResult.length ? parseFloat(feeResult[0].values[0][0]) : 0.05;

  const result = db.exec(`
    SELECT p.id, p.name, p.sku, p.category, p.supplier,
           p.purchase_price, p.shipping_cost, p.selling_price,
           COALESCE(i.quantity, 0) as stock_quantity
    FROM products p
    LEFT JOIN inventory i ON p.id = i.product_id
    WHERE p.status = 'active'
    ORDER BY p.name
  `);

  const items = rowsToObjects(result).map(item => {
    const platformFee = item.selling_price * feeRate;
    const profit = item.selling_price - item.purchase_price - item.shipping_cost - platformFee;
    const profitRate = item.selling_price > 0 ? (profit / item.selling_price * 100) : 0;
    return {
      ...item,
      platform_fee_rate: feeRate,
      platform_fee: Math.round(platformFee * 100) / 100,
      gross_profit: Math.round(profit * 100) / 100,
      gross_profit_rate: Math.round(profitRate * 100) / 100,
    };
  });

  res.json(items);
});

// 汇总统计
router.get('/summary', (req, res) => {
  const db = getDB();

  const totalProducts = db.exec("SELECT COUNT(*) as cnt FROM products");
  const activeProducts = db.exec("SELECT COUNT(*) as cnt FROM products WHERE status = 'active'");
  const draftProducts = db.exec("SELECT COUNT(*) as cnt FROM products WHERE status = 'draft'");
  const totalStock = db.exec("SELECT COALESCE(SUM(quantity), 0) as total FROM inventory");

  const inboundToday = db.exec("SELECT COALESCE(SUM(quantity), 0) as total FROM inventory_records WHERE type = 'inbound' AND date(created_at) = date('now', 'localtime')");
  const outboundToday = db.exec("SELECT COALESCE(SUM(quantity), 0) as total FROM inventory_records WHERE type = 'outbound' AND date(created_at) = date('now', 'localtime')");

  res.json({
    total_products: totalProducts[0].values[0][0],
    active_products: activeProducts[0].values[0][0],
    draft_products: draftProducts[0].values[0][0],
    total_stock: totalStock[0].values[0][0],
    inbound_today: inboundToday[0].values[0][0],
    outbound_today: outboundToday[0].values[0][0],
  });
});

module.exports = router;
