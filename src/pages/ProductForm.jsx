import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, InputNumber, Select, Button, Card, message, Space } from 'antd';
import api from '../api';
import { getUser } from '../utils/auth';

export default function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const user = getUser();
  const isEdit = !!id;
  const isFinance = user?.role === 'finance';

  useEffect(() => {
    if (isEdit) {
      api.get(`/products/${id}`).then(data => {
        form.setFieldsValue(data);
      });
    }
  }, [id]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/products/${id}`, values);
        message.success('更新成功');
      } else {
        await api.post('/products', values);
        message.success('创建成功');
      }
      navigate('/products');
    } catch (err) {
      message.error(err.error || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title={isEdit ? (isFinance ? '编辑商品价格' : '编辑商品') : '新增商品'} style={{ maxWidth: 800 }}>
      <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ status: 'draft' }}>
        <Form.Item name="name" label="商品名称" rules={[{ required: true, message: '请输入商品名称' }]}>
          <Input placeholder="请输入商品名称" disabled={isFinance} />
        </Form.Item>
        <Form.Item name="taobao_url" label="淘宝链接">
          <Input placeholder="https://item.taobao.com/..." disabled={isFinance} />
        </Form.Item>
        <Form.Item name="sku" label="SKU编码">
          <Input placeholder="请输入SKU编码" disabled={isFinance} />
        </Form.Item>
        <Form.Item name="category" label="分类">
          <Input placeholder="请输入分类" disabled={isFinance} />
        </Form.Item>
        <Form.Item name="supplier" label="供应商">
          <Input placeholder="请输入供应商名称" disabled={isFinance} />
        </Form.Item>
        <Form.Item label="成本信息" style={{ marginBottom: 0 }}>
          <Space size="large">
            <Form.Item name="purchase_price" label="采购单价(¥)">
              <InputNumber min={0} precision={2} style={{ width: 150 }} />
            </Form.Item>
            <Form.Item name="shipping_cost" label="运费(¥)">
              <InputNumber min={0} precision={2} style={{ width: 150 }} />
            </Form.Item>
            <Form.Item name="selling_price" label="售价(¥)">
              <InputNumber min={0} precision={2} style={{ width: 150 }} />
            </Form.Item>
          </Space>
        </Form.Item>
        {!isFinance && (
          <Form.Item name="status" label="状态">
            <Select
              options={[
                { label: '草稿', value: 'draft' },
                { label: '已上架', value: 'active' },
                { label: '已下架', value: 'inactive' },
              ]}
            />
          </Form.Item>
        )}
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              {isEdit ? '保存' : '创建'}
            </Button>
            <Button onClick={() => navigate('/products')}>取消</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
