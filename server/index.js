const express = require('express');
const cors = require('cors');
const { initDB } = require('./db');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// 公开路由
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// 需要认证的路由
app.use('/api/products', authMiddleware, require('./routes/products'));
app.use('/api/inventory', authMiddleware, require('./routes/inventory'));
app.use('/api/cost', authMiddleware, require('./routes/cost'));
app.use('/api/users', authMiddleware, require('./routes/users'));
app.use('/api/product-links', authMiddleware, require('./routes/productLinks'));
app.use('/api/raw-materials', authMiddleware, require('./routes/rawMaterials'));
app.use('/api/consumables', authMiddleware, require('./routes/consumables'));
app.use('/api/labels', authMiddleware, require('./routes/labels'));

async function start() {
  await initDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
