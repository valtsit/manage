const express = require('express');
const bcrypt = require('bcryptjs');
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

// 获取用户列表
router.get('/', roleMiddleware('admin'), (req, res) => {
  const db = getDB();
  const result = db.exec("SELECT id, username, role, created_at FROM users ORDER BY id");
  res.json(rowsToObjects(result));
});

// 创建用户
router.post('/', roleMiddleware('admin'), (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码必填' });
  }
  if (!['admin', 'operations', 'warehouse', 'finance'].includes(role)) {
    return res.status(400).json({ error: '角色无效' });
  }

  const db = getDB();
  const exists = db.exec("SELECT id FROM users WHERE username = ?", [username]);
  if (exists.length) {
    return res.status(400).json({ error: '用户名已存在' });
  }

  const hash = bcrypt.hashSync(password, 10);
  db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", [username, hash, role]);
  saveDB();
  res.json({ message: '创建成功' });
});

// 更新用户
router.put('/:id', roleMiddleware('admin'), (req, res) => {
  const { password, role } = req.body;
  const db = getDB();

  if (password) {
    const hash = bcrypt.hashSync(password, 10);
    db.run("UPDATE users SET password = ? WHERE id = ?", [hash, req.params.id]);
  }
  if (role && ['admin', 'operations', 'warehouse', 'finance'].includes(role)) {
    db.run("UPDATE users SET role = ? WHERE id = ?", [role, req.params.id]);
  }
  saveDB();
  res.json({ message: '更新成功' });
});

// 删除用户
router.delete('/:id', roleMiddleware('admin'), (req, res) => {
  if (parseInt(req.params.id) === req.user.id) {
    return res.status(400).json({ error: '不能删除自己' });
  }
  const db = getDB();
  db.run("DELETE FROM users WHERE id = ?", [req.params.id]);
  saveDB();
  res.json({ message: '删除成功' });
});

module.exports = router;
