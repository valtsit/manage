# Manage

电商运营与仓库管理系统 — 基于 React + Express 的全栈应用。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18, React Router, Ant Design, Axios |
| 后端 | Express, JWT 认证, bcryptjs |
| 数据库 | SQLite (sql.js) |
| 构建工具 | Vite, Concurrently |

## 功能模块

- **产品关联** — 商品与链接管理
- **库存管理** — 实时库存查看与更新
- **原材料管理** — 原材料的增删改查
- **耗材管理** — 耗材入库与消耗记录
- **标签管理** — 产品标签的创建与维护
- **成本分析** — 运营成本统计与可视化
- **用户管理** — 多用户角色与权限控制

## 快速开始

### 环境要求

- Node.js >= 16

### 安装与运行

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server && npm install && cd ..

# 同时启动前后端
npm run dev
```

Windows 用户可直接双击 `start.bat`，脚本会自动安装依赖并启动服务。

### 访问

- 前端：http://localhost:5173
- 后端：http://localhost:3001
- 默认账号：`admin` / `admin123`

## 项目结构

```
├── src/                # 前端源码
│   ├── pages/          # 页面组件
│   ├── components/     # 公共组件
│   ├── api/            # API 请求
│   └── utils/          # 工具函数
├── server/             # 后端源码
│   ├── routes/         # API 路由
│   ├── middleware/     # 中间件 (JWT 认证)
│   └── db.js           # 数据库初始化
├── index.html          # 入口 HTML
├── vite.config.js      # Vite 配置
└── start.bat           # Windows 一键启动
```

## License

MIT
