import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Input, Space, Popconfirm, Tag, message } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../api';
import { getUser } from '../utils/auth';

export default function ProductLinks() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();
  const user = getUser();
  const canEdit = ['admin', 'operations'].includes(user?.role);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const params = {};
      if (keyword) params.keyword = keyword;
      const data = await api.get('/product-links', { params });
      setLinks(data);
    } catch (err) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLinks(); }, []);

  const handleDelete = async (id) => {
    try {
      await api.delete(`/product-links/${id}`);
      message.success('删除成功');
      fetchLinks();
    } catch (err) {
      message.error(err.error || '删除失败');
    }
  };

  const itemColumns = [
    { title: 'SKU ID', dataIndex: 'sku_id', width: 120 },
    { title: '实发等级规格', dataIndex: 'grade_spec', width: 120 },
    { title: '销售克重(g)', dataIndex: 'sales_weight', width: 100 },
    { title: '成本合计(¥)', dataIndex: 'total_cost', width: 100, render: v => `¥${v || 0}` },
    { title: '上新到手价(¥)', dataIndex: 'new_price', width: 110, render: v => `¥${v || 0}` },
    { title: '毛利率(%)', dataIndex: 'profit_margin', width: 90, render: v => `${v || 0}%` },
  ];

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '商品名称', dataIndex: 'name', ellipsis: true },
    { title: '链接地址', width: 120, render: (_, record) => record.tmall_id
        ? <a href={`https://detail.tmall.com/item.htm?id=${record.tmall_id}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>{record.tmall_id}</a>
        : '-' },
    { title: '标题', dataIndex: 'title', ellipsis: true },
    { title: 'SKU数', width: 80, render: (_, record) => <Tag color="blue">{record.items?.length || 0}</Tag> },
    { title: '创建人', dataIndex: 'creator_name', width: 80 },
    { title: '修改人', dataIndex: 'updater_name', width: 80 },
    { title: '创建日期', dataIndex: 'created_at', width: 160 },
    { title: '修改日期', dataIndex: 'updated_at', width: 160 },
    { title: '备注', dataIndex: 'remark', ellipsis: true, width: 150 },
    {
      title: '操作', width: 150, fixed: 'right',
      render: (_, record) => (
        <Space>
          {canEdit && (
            <>
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => navigate(`/product-links/${record.id}/edit`)}>编辑</Button>
              <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
                <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
              </Popconfirm>
            </>
          )}
          {!canEdit && (
            <Button type="link" size="small" onClick={() => navigate(`/product-links/${record.id}/edit`)}>查看</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>商品链接</h2>
        {canEdit && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/product-links/new')}>
            新增商品链接
          </Button>
        )}
      </div>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="搜索商品名称/标题"
          prefix={<SearchOutlined />}
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          onPressEnter={fetchLinks}
          style={{ width: 250 }}
          allowClear
        />
        <Button onClick={fetchLinks}>查询</Button>
      </Space>
      <Table
        dataSource={links}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="small"
        scroll={{ x: 1200 }}
        expandable={{
          expandedRowRender: record => (
            <div style={{ padding: '0 24px', background: '#fafafa', borderRadius: 4 }}>
              <div style={{ padding: '8px 0', fontWeight: 500, fontSize: 13, color: '#666' }}>
                商品细分（共 {record.items.length} 个 SKU）
              </div>
              <Table
                dataSource={record.items}
                columns={itemColumns}
                rowKey="id"
                size="small"
                pagination={false}
              />
            </div>
          ),
          rowExpandable: record => record.items && record.items.length > 0,
        }}
      />
    </div>
  );
}
