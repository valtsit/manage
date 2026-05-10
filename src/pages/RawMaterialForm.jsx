import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, InputNumber, Button, Card, Space, message } from 'antd';
import api from '../api';

export default function RawMaterialForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) api.get(`/raw-materials/${id}`).then(data => form.setFieldsValue(data));
  }, [id]);

  const onFinish = async (values) => {
    setLoading(true);
    values.loss_price = (values.purchase_price && values.loss_rate != null)
      ? values.purchase_price / (1 - values.loss_rate / 100) : 0;
    try {
      if (isEdit) { await api.put(`/raw-materials/${id}`, values); message.success('更新成功'); }
      else { await api.post('/raw-materials', values); message.success('创建成功'); }
      navigate('/raw-materials');
    } catch (err) { message.error(err.error || '操作失败'); }
    finally { setLoading(false); }
  };

  const purchasePrice = Form.useWatch('purchase_price', form);
  const lossRate = Form.useWatch('loss_rate', form);
  const lossPrice = purchasePrice && lossRate != null ? (purchasePrice / (1 - lossRate / 100)).toFixed(2) : 0;

  return (
    <Card title={isEdit ? '编辑原料' : '新增原料'} style={{ maxWidth: 800 }}>
      <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ loss_rate: 5 }}>
        <Form.Item name="name" label="原料名称" rules={[{ required: true, message: '请输入原料名称' }]}>
          <Input placeholder="请输入原料名称" />
        </Form.Item>
        <Form.Item label="成本信息" style={{ marginBottom: 0 }}>
          <Space size="large">
            <Form.Item name="purchase_price" label="采购价(KG/¥)">
              <InputNumber min={0} precision={2} style={{ width: 150 }} />
            </Form.Item>
            <Form.Item name="loss_rate" label="生产损耗(%)">
              <InputNumber min={0} max={100} precision={2} style={{ width: 150 }} />
            </Form.Item>
            <Form.Item label="损耗价(KG/¥)">
              <InputNumber value={lossPrice} disabled style={{ width: 150 }} />
            </Form.Item>
          </Space>
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={2} placeholder="请输入备注" />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>{isEdit ? '保存' : '创建'}</Button>
            <Button onClick={() => navigate('/raw-materials')}>取消</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
