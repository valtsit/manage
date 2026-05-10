import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Space, Tag, message, Tabs } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import api from '../api';
import { getUser } from '../utils/auth';

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [records, setRecords] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const user = getUser();
  const canOperate = ['admin', 'warehouse'].includes(user?.role);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [inv, rec, prods] = await Promise.all([
        api.get('/inventory'),
        api.get('/inventory/records?limit=50'),
        api.get('/products'),
      ]);
      setInventory(inv);
      setRecords(rec);
      setProducts(prods);
    } catch {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleOperate = async (values) => {
    try {
      await api.post('/inventory/operate', values);
      message.success(values.type === 'inbound' ? '入库成功' : '出库成功');
      setModalOpen(false);
      form.resetFields();
      fetchAll();
    } catch (err) {
      message.error(err.error || '操作失败');
    }
  };

  const invColumns = [
    { title: '商品名称', dataIndex: 'name' },
    { title: 'SKU', dataIndex: 'sku', width: 120 },
    { title: '分类', dataIndex: 'category', width: 100 },
    { title: '库存数量', dataIndex: 'quantity', width: 100, render: v => <strong>{v}</strong> },
    { title: '更新时间', dataIndex: 'updated_at', width: 170 },
  ];

  const recordColumns = [
    { title: '商品', dataIndex: 'product_name' },
    { title: 'SKU', dataIndex: 'sku', width: 120 },
    {
      title: '类型', dataIndex: 'type', width: 80,
      render: v => v === 'inbound' ? <Tag color="green">入库</Tag> : <Tag color="red">出库</Tag>,
    },
    { title: '数量', dataIndex: 'quantity', width: 80 },
    { title: '备注', dataIndex: 'note', ellipsis: true },
    { title: '操作人', dataIndex: 'operator_name', width: 80 },
    { title: '时间', dataIndex: 'created_at', width: 170 },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>库存管理</h2>
        {canOperate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { form.resetFields(); setModalOpen(true); }}>
            入库/出库
          </Button>
        )}
      </div>

      <Tabs
        items={[
          { key: 'stock', label: '库存总览', children: (
            <Table dataSource={inventory} columns={invColumns} rowKey="id" loading={loading} size="small" />
          )},
          { key: 'records', label: '出入库记录', children: (
            <Table dataSource={records} columns={recordColumns} rowKey="id" loading={loading} size="small" />
          )},
        ]}
      />

      <Modal title="入库/出库操作" open={modalOpen} onCancel={() => setModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleOperate}>
          <Form.Item name="product_id" label="选择商品" rules={[{ required: true, message: '请选择商品' }]}>
            <Select
              showSearch
              placeholder="搜索商品"
              optionFilterProp="label"
              options={products.map(p => ({ label: `${p.name} (${p.sku || '无SKU'})`, value: p.id }))}
            />
          </Form.Item>
          <Form.Item name="type" label="操作类型" rules={[{ required: true, message: '请选择操作类型' }]}>
            <Select
              options={[
                { label: '入库', value: 'inbound' },
                { label: '出库', value: 'outbound' },
              ]}
            />
          </Form.Item>
          <Form.Item name="quantity" label="数量" rules={[{ required: true, message: '请输入数量' }]}>
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入数量" />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input placeholder="可选备注" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>确认提交</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
