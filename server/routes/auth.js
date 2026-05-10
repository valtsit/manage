const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDB, saveDB } = require('../db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '请输入用户名和密码' });
  }

  const db = getDB();
  const result = db.exec("SELECT * FROM users WHERE username = ?", [username]);
  if (!result.length || !result[0].values.length) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const cols = result[0].columns;
  const row = result[0].values[0];
  const user = {};
  cols.forEach((col, i) => { user[col] = row[i]; });

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
});

router.get('/me', (req, res) => {
  const db = getDB();
  const result = db.exec("SELECT id, username, role, created_at FROM users WHERE id = ?", [req.user.id]);
  if (!result.length || !result[0].values.length) {
    return res.status(404).json({ error: '用户不存在' });
  }
  const cols = result[0].columns;
  const row = result[0].values[0];
  const user = {};
  cols.forEach((col, i) => { user[col] = row[i]; });
  res.json(user);
});

module.exports = router;
