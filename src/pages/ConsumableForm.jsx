import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, InputNumber, Button, Card, Space, message } from 'antd';
import api from '../api';

export default function ConsumableForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) api.get(`/consumables/${id}`).then(data => form.setFieldsValue(data));
  }, [id]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      if (isEdit) { await api.put(`/consumables/${id}`, values); message.success('更新成功'); }
      else { await api.post('/consumables', values); message.success('创建成功'); }
      navigate('/consumables');
    } catch (err) { message.error(err.error || '操作失败'); }
    finally { setLoading(false); }
  };

  return (
    <Card title={isEdit ? '编辑耗材包装' : '新增耗材包装'} style={{ maxWidth: 800 }}>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item name="name" label="耗材包装名称" rules={[{ required: true, message: '请输入名称' }]}>
          <Input placeholder="请输入名称" />
        </Form.Item>
        <Form.Item label="成本信息" style={{ marginBottom: 0 }}>
          <Space size="large">
            <Form.Item name="labor_cost" label="人工成本(¥)">
              <InputNumber min={0} precision={2} style={{ width: 150 }} />
            </Form.Item>
            <Form.Item name="packaging_cost" label="包装成本(¥)">
              <InputNumber min={0} precision={2} style={{ width: 150 }} />
            </Form.Item>
            <Form.Item name="label_cost" label="标签成本(¥)">
              <InputNumber min={0} precision={2} style={{ width: 150 }} />
            </Form.Item>
          </Space>
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={2} placeholder="请输入备注" />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>{isEdit ? '保存' : '创建'}</Button>
            <Button onClick={() => navigate('/consumables')}>取消</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
