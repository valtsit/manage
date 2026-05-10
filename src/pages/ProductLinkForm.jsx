import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, InputNumber, Button, Card, Table, Space, Popconfirm, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../api';

export default function ProductLinkForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      api.get(`/product-links/${id}`).then(data => {
        form.setFieldsValue({ name: data.name, tmall_id: data.tmall_id || '', title: data.title, remark: data.remark });
        setItems((data.items || []).map((item, i) => ({ ...item, key: i })));
      });
    }
  }, [id]);

  const addItem = () => {
    setItems(prev => [...prev, { key: Date.now(), sku_id: '', grade_spec: '', sales_weight: 0, total_cost: 0, new_price: 0, profit_margin: 0 }]);
  };

  const removeItem = (key) => {
    setItems(prev => prev.filter(item => item.key !== key));
  };

  const updateItem = (key, field, value) => {
    setItems(prev => prev.map(item => item.key === key ? { ...item, [field]: value } : item));
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        items: items.map(({ key, ...rest }) => rest),
      };
      if (isEdit) {
        await api.put(`/product-links/${id}`, payload);
        message.success('更新成功');
      } else {
        await api.post('/product-links', payload);
        message.success('创建成功');
      }
      navigate('/product-links');
    } catch (err) {
      message.error(err.error || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const itemColumns = [
    {
      title: 'SKU ID', dataIndex: 'sku_id', width: 130,
      render: (_, record) => <Input value={record.sku_id} onChange={e => updateItem(record.key, 'sku_id', e.target.value)} placeholder="SKU ID" />,
    },
    {
      title: '实发等级规格', dataIndex: 'grade_spec', width: 130,
      render: (_, record) => <Input value={record.grade_spec} onChange={e => updateItem(record.key, 'grade_spec', e.target.value)} placeholder="等级规格" />,
    },
    {
      title: '销售克重(g)', dataIndex: 'sales_weight', width: 120,
      render: (_, record) => <InputNumber min={0} precision={2} value={record.sales_weight} onChange={v => updateItem(record.key, 'sales_weight', v)} style={{ width: '100%' }} />,
    },
    {
      title: '成本合计(¥)', dataIndex: 'total_cost', width: 120,
      render: (_, record) => <InputNumber min={0} precision={2} value={record.total_cost} onChange={v => updateItem(record.key, 'total_cost', v)} style={{ width: '100%' }} />,
    },
    {
      title: '上新到手价(¥)', dataIndex: 'new_price', width: 130,
      render: (_, record) => <InputNumber min={0} precision={2} value={record.new_price} onChange={v => updateItem(record.key, 'new_price', v)} style={{ width: '100%' }} />,
    },
    {
      title: '毛利率(%)', dataIndex: 'profit_margin', width: 110,
      render: (_, record) => <InputNumber min={0} max={100} precision={2} value={record.profit_margin} onChange={v => updateItem(record.key, 'profit_margin', v)} style={{ width: '100%' }} />,
    },
    {
      title: '操作', width: 70,
      render: (_, record) => (
        <Popconfirm title="确定删除？" onConfirm={() => removeItem(record.key)}>
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <Card title={isEdit ? '编辑商品链接' : '新增商品链接'} style={{ maxWidth: 1100 }}>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="name" label="商品名称" rules={[{ required: true, message: '请输入商品名称' }]}>
          <Input placeholder="请输入商品名称" />
        </Form.Item>
        <Form.Item name="tmall_id" label="链接地址">
          <Input addonBefore="https://detail.tmall.com/item.htm?id=" placeholder="请输入商品ID" />
        </Form.Item>
        <Form.Item name="title" label="标题">
          <Input placeholder="请输入商品标题" />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={2} placeholder="请输入备注" />
        </Form.Item>

        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong>商品细分</strong>
            <Button type="dashed" icon={<PlusOutlined />} onClick={addItem}>添加细分</Button>
          </div>
          <Table
            dataSource={items}
            columns={itemColumns}
            rowKey="key"
            size="small"
            pagination={false}
            scroll={{ x: 900 }}
          />
        </div>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEdit ? '保存' : '创建'}
            </Button>
            <Button onClick={() => navigate('/product-links')}>取消</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
