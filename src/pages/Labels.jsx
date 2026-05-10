import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Input, Space, Tag, Popconfirm, message } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../api';
import { getUser } from '../utils/auth';

export default function Labels() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();
  const user = getUser();
  const canEdit = ['admin', 'operations'].includes(user?.role);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (keyword) params.keyword = keyword;
      setData(await api.get('/labels', { params }));
    } catch { message.error('加载失败'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id) => {
    try { await api.delete(`/labels/${id}`); message.success('删除成功'); fetchData(); }
    catch (err) { message.error(err.error || '删除失败'); }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 50 },
    { title: '店铺', dataIndex: 'shop', width: 100, ellipsis: true },
    { title: '品种', dataIndex: 'variety', width: 100, ellipsis: true },
    { title: '装量(g)', dataIndex: 'weight', width: 80 },
    { title: '规格', dataIndex: 'spec', width: 80, ellipsis: true },
    { title: '内标/外标', dataIndex: 'label_type', width: 90 },
    { title: '瓶子尺寸', dataIndex: 'bottle_size', width: 90 },
    { title: '标签尺寸', dataIndex: 'label_size', width: 90 },
    { title: '内袋', width: 60, render: (_, r) => r.has_inner_bag ? <Tag color="green">有</Tag> : <Tag>无</Tag> },
    { title: '已发送', width: 80, render: (_, r) => r.is_sent ? <Tag color="blue">已发送</Tag> : <Tag>未发送</Tag> },
    { title: '发送日期', dataIndex: 'sent_date', width: 100 },
    { title: '条形码', width: 70, render: (_, r) => r.has_barcode ? <Tag color="green">有</Tag> : <Tag>无</Tag> },
    { title: '创建人', dataIndex: 'creator_name', width: 70 },
    { title: '修改人', dataIndex: 'updater_name', width: 70 },
    { title: '备注', dataIndex: 'remark', ellipsis: true, width: 120 },
    {
      title: '操作', width: 150, fixed: 'right',
      render: (_, record) => canEdit ? (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => navigate(`/labels/${record.id}/edit`)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ) : <Button type="link" size="small" onClick={() => navigate(`/labels/${record.id}/edit`)}>查看</Button>,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>标签管理</h2>
        {canEdit && <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/labels/new')}>新增标签</Button>}
      </div>
      <Space style={{ marginBottom: 16 }}>
        <Input placeholder="搜索店铺/品种/规格" prefix={<SearchOutlined />} value={keyword} onChange={e => setKeyword(e.target.value)} onPressEnter={fetchData} style={{ width: 250 }} allowClear />
        <Button onClick={fetchData}>查询</Button>
      </Space>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} size="small" scroll={{ x: 1600 }} />
    </div>
  );
}
