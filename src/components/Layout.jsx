import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown } from 'antd';
import {
  DashboardOutlined,
  LinkOutlined,
  AppstoreOutlined,
  ExperimentOutlined,
  BoxPlotOutlined,
  TagsOutlined,
  InboxOutlined,
  DollarOutlined,
  TeamOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { getUser, logout } from '../utils/auth';

const { Header, Sider, Content } = Layout;

const menuConfig = [
  { key: '/', icon: <DashboardOutlined />, label: '首页概览' },
  { key: '/product-links', icon: <LinkOutlined />, label: '商品链接', roles: ['admin', 'operations', 'finance'] },
  {
    key: '/inventory-group', icon: <InboxOutlined />, label: '库存管理', roles: ['admin', 'warehouse', 'operations'],
    children: [
      { key: '/inventory', icon: <AppstoreOutlined />, label: '库存总览', roles: ['admin', 'warehouse', 'operations'] },
      { key: '/raw-materials', icon: <ExperimentOutlined />, label: '原料管理', roles: ['admin', 'operations', 'warehouse'] },
      { key: '/consumables', icon: <BoxPlotOutlined />, label: '耗材包装', roles: ['admin', 'operations', 'warehouse'] },
      { key: '/labels', icon: <TagsOutlined />, label: '标签管理', roles: ['admin', 'operations', 'warehouse'] },
    ],
  },
  { key: '/cost', icon: <DollarOutlined />, label: '成本分析', roles: ['admin', 'finance', 'operations'] },
  { key: '/users', icon: <TeamOutlined />, label: '用户管理', roles: ['admin'] },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();

  const inventoryPaths = ['/inventory', '/raw-materials', '/consumables', '/labels'];
  const openKeys = inventoryPaths.includes(location.pathname) ? ['/inventory-group'] : [];

  const items = menuConfig
    .filter(item => !item.roles || item.roles.includes(user?.role))
    .map(item => {
      if (item.children) {
        const filteredChildren = item.children
          .filter(c => !c.roles || c.roles.includes(user?.role))
          .map(c => ({ key: c.key, icon: c.icon, label: c.label }));
        return { key: item.key, icon: item.icon, label: item.label, children: filteredChildren };
      }
      return { key: item.key, icon: item.icon, label: item.label };
    });

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  const handleUserMenu = ({ key }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    }
  };

  const roleLabels = { admin: '管理员', operations: '运营', warehouse: '仓库', finance: '财务' };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" width={200}>
        <div style={{ height: 48, margin: 16, color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center', lineHeight: '48px' }}>
          电商运营管理
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          defaultOpenKeys={openKeys}
          items={items}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenu }}>
            <Button type="text" icon={<UserOutlined />}>
              {user?.username} ({roleLabels[user?.role] || user?.role})
            </Button>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, padding: 24, background: '#fff', borderRadius: 8 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
