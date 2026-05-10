import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, Popconfirm, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../api';
import { getUser } from '../utils/auth';

const roleLabels = { admin: '管理员', operations: '运营', warehouse: '仓库', finance: '财务' };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const currentUser = getUser();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.get('/users');
      setUsers(data);
    } catch {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleOpen = (user = null) => {
    setEditingUser(user);
    form.resetFields();
    if (user) {
      form.setFieldsValue({ username: user.username, role: user.role });
    }
    setModalOpen(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingUser) {
        const payload = { role: values.role };
        if (values.password) payload.password = values.password;
        await api.put(`/users/${editingUser.id}`, payload);
        message.success('更新成功');
      } else {
        await api.post('/users', values);
        message.success('创建成功');
      }
      setModalOpen(false);
      fetchUsers();
    } catch (err) {
      message.error(err.error || '操作失败');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      message.success('删除成功');
      fetchUsers();
    } catch (err) {
      message.error(err.error || '删除失败');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '用户名', dataIndex: 'username' },
    { title: '角色', dataIndex: 'role', render: v => roleLabels[v] || v },
    { title: '创建时间', dataIndex: 'created_at' },
    {
      title: '操作', width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleOpen(record)}>编辑</Button>
          {record.id !== currentUser?.id && (
            <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>用户管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpen()}>
          新增用户
        </Button>
      </div>
      <Table dataSource={users} columns={columns} rowKey="id" loading={loading} size="small" />

      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="username" label="用户名" rules={[{ required: !editingUser, message: '请输入用户名' }]}>
            <Input placeholder="请输入用户名" disabled={!!editingUser} />
          </Form.Item>
          <Form.Item name="password" label={editingUser ? '新密码（留空不修改）' : '密码'} rules={[{ required: !editingUser, message: '请输入密码' }]}>
            <Input.Password placeholder={editingUser ? '留空不修改' : '请输入密码'} />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
            <Select
              options={Object.entries(roleLabels).map(([value, label]) => ({ label, value }))}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>确认</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
