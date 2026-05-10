import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Input, Space, Popconfirm, message } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../api';
import { getUser } from '../utils/auth';

export default function RawMaterials() {
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
      setData(await api.get('/raw-materials', { params }));
    } catch { message.error('加载失败'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDelete = async (id) => {
    try { await api.delete(`/raw-materials/${id}`); message.success('删除成功'); fetchData(); }
    catch (err) { message.error(err.error || '删除失败'); }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '原料名称', dataIndex: 'name', ellipsis: true },
    { title: '采购价(KG/¥)', dataIndex: 'purchase_price', width: 130, render: v => `¥${v || 0}` },
    { title: '生产损耗(%)', dataIndex: 'loss_rate', width: 110, render: v => `${v || 0}%` },
    { title: '损耗价(KG/¥)', dataIndex: 'loss_price', width: 130, render: v => `¥${v || 0}` },
    { title: '创建人', dataIndex: 'creator_name', width: 80 },
    { title: '修改人', dataIndex: 'updater_name', width: 80 },
    { title: '创建日期', dataIndex: 'created_at', width: 160 },
    { title: '修改日期', dataIndex: 'updated_at', width: 160 },
    { title: '备注', dataIndex: 'remark', ellipsis: true, width: 150 },
    {
      title: '操作', width: 150, fixed: 'right',
      render: (_, record) => canEdit ? (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => navigate(`/raw-materials/${record.id}/edit`)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ) : <Button type="link" size="small" onClick={() => navigate(`/raw-materials/${record.id}/edit`)}>查看</Button>,
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>原料管理</h2>
        {canEdit && <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/raw-materials/new')}>新增原料</Button>}
      </div>
      <Space style={{ marginBottom: 16 }}>
        <Input placeholder="搜索原料名称" prefix={<SearchOutlined />} value={keyword} onChange={e => setKeyword(e.target.value)} onPressEnter={fetchData} style={{ width: 200 }} allowClear />
        <Button onClick={fetchData}>查询</Button>
      </Space>
      <Table dataSource={data} columns={columns} rowKey="id" loading={loading} size="small" scroll={{ x: 1200 }} />
    </div>
  );
}
