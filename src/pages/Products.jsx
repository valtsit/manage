import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Input, Select, Space, Tag, Popconfirm, message } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../api';
import { getUser } from '../utils/auth';

const statusMap = {
  draft: { color: 'default', text: '草稿' },
  active: { color: 'green', text: '已上架' },
  inactive: { color: 'red', text: '已下架' },
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('');
  const navigate = useNavigate();
  const user = getUser();
  const canEdit = ['admin', 'operations'].includes(user?.role);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (keyword) params.keyword = keyword;
      if (status) params.status = status;
      const data = await api.get('/products', { params });
      setProducts(data);
    } catch (err) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      message.success('删除成功');
      fetchProducts();
    } catch (err) {
      message.error(err.error || '删除失败');
    }
  };

  const columns = [
    { title: '商品名称', dataIndex: 'name', ellipsis: true },
    { title: 'SKU', dataIndex: 'sku', width: 120 },
    { title: '分类', dataIndex: 'category', width: 100 },
    { title: '供应商', dataIndex: 'supplier', width: 120 },
    { title: '采购价', dataIndex: 'purchase_price', width: 90, render: v => `¥${v || 0}` },
    { title: '运费', dataIndex: 'shipping_cost', width: 80, render: v => `¥${v || 0}` },
    { title: '售价', dataIndex: 'selling_price', width: 90, render: v => `¥${v || 0}` },
    {
      title: '状态', dataIndex: 'status', width: 90,
      render: (v) => {
        const s = statusMap[v] || statusMap.draft;
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    { title: '创建人', dataIndex: 'creator_name', width: 80 },
    {
      title: '操作', width: 150, fixed: 'right',
      render: (_, record) => (
        <Space>
          {canEdit && (
            <>
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => navigate(`/products/${record.id}/edit`)}>编辑</Button>
              <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
                <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
              </Popconfirm>
            </>
          )}
          {!canEdit && (
            <Button type="link" size="small" onClick={() => navigate(`/products/${record.id}/edit`)}>查看</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>商品管理</h2>
        {canEdit && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/products/new')}>
            新增商品
          </Button>
        )}
      </div>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="搜索商品名称/SKU"
          prefix={<SearchOutlined />}
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          onPressEnter={fetchProducts}
          style={{ width: 200 }}
          allowClear
        />
        <Select
          placeholder="状态筛选"
          value={status}
          onChange={v => { setStatus(v); setTimeout(fetchProducts, 0); }}
          style={{ width: 120 }}
          allowClear
          options={[
            { label: '草稿', value: 'draft' },
            { label: '已上架', value: 'active' },
            { label: '已下架', value: 'inactive' },
          ]}
        />
        <Button onClick={fetchProducts}>查询</Button>
      </Space>
      <Table
        dataSource={products}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="small"
        scroll={{ x: 1200 }}
      />
    </div>
  );
}
