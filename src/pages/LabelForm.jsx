import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Form, Input, InputNumber, Select, DatePicker, Switch, Button, Card, Space, message } from 'antd';
import api from '../api';
import dayjs from 'dayjs';

export default function LabelForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isEdit = !!id;

  useEffect(() => {
    if (isEdit) {
      api.get(`/labels/${id}`).then(data => {
        form.setFieldsValue({ ...data, has_inner_bag: !!data.has_inner_bag, is_sent: !!data.is_sent, has_barcode: !!data.has_barcode, sent_date: data.sent_date ? dayjs(data.sent_date) : null });
      });
    }
  }, [id]);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        has_inner_bag: values.has_inner_bag ? 1 : 0,
        is_sent: values.is_sent ? 1 : 0,
        has_barcode: values.has_barcode ? 1 : 0,
        sent_date: values.sent_date ? values.sent_date.format('YYYY-MM-DD') : '',
      };
      if (isEdit) { await api.put(`/labels/${id}`, payload); message.success('更新成功'); }
      else { await api.post('/labels', payload); message.success('创建成功'); }
      navigate('/labels');
    } catch (err) { message.error(err.error || '操作失败'); }
    finally { setLoading(false); }
  };

  return (
    <Card title={isEdit ? '编辑标签' : '新增标签'} style={{ maxWidth: 900 }}>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item label="基本信息" style={{ marginBottom: 0 }}>
          <Space size="large" wrap>
            <Form.Item name="shop" label="店铺"><Input placeholder="店铺名称" style={{ width: 150 }} /></Form.Item>
            <Form.Item name="variety" label="品种"><Input placeholder="品种" style={{ width: 150 }} /></Form.Item>
            <Form.Item name="weight" label="装量(g)"><InputNumber min={0} precision={2} style={{ width: 120 }} /></Form.Item>
            <Form.Item name="spec" label="规格"><Input placeholder="规格" style={{ width: 120 }} /></Form.Item>
          </Space>
        </Form.Item>
        <Form.Item label="标签信息" style={{ marginBottom: 0 }}>
          <Space size="large" wrap>
            <Form.Item name="label_type" label="内标/外标">
              <Select style={{ width: 120 }} options={[{ label: '内标', value: '内标' }, { label: '外标', value: '外标' }]} allowClear placeholder="请选择" />
            </Form.Item>
            <Form.Item name="bottle_size" label="瓶子尺寸(mm)"><Input placeholder="如: 50x30" style={{ width: 130 }} /></Form.Item>
            <Form.Item name="label_size" label="标签尺寸(mm)"><Input placeholder="如: 80x50" style={{ width: 130 }} /></Form.Item>
            <Form.Item name="has_inner_bag" label="内袋" valuePropName="checked"><Switch /></Form.Item>
          </Space>
        </Form.Item>
        <Form.Item name="label_content" label="标签属性/内容">
          <Input.TextArea rows={2} placeholder="标签内容说明" />
        </Form.Item>
        <Form.Item label="状态信息" style={{ marginBottom: 0 }}>
          <Space size="large" wrap>
            <Form.Item name="is_sent" label="已发送" valuePropName="checked"><Switch /></Form.Item>
            <Form.Item name="sent_date" label="发送日期"><DatePicker style={{ width: 150 }} /></Form.Item>
            <Form.Item name="has_barcode" label="条形码" valuePropName="checked"><Switch /></Form.Item>
          </Space>
        </Form.Item>
        <Form.Item name="thumbnail" label="缩略图">
          <Input placeholder="图片URL" />
        </Form.Item>
        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={2} placeholder="其他说明" />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>{isEdit ? '保存' : '创建'}</Button>
            <Button onClick={() => navigate('/labels')}>取消</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
