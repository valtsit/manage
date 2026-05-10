import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag } from 'antd';
import {
  ShoppingOutlined,
  CheckCircleOutlined,
  EditOutlined,
  InboxOutlined,
  ArrowDownOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';
import api from '../api';

export default function Dashboard() {
  const [summary, setSummary] = useState({});
  const [records, setRecords] = useState([]);

  useEffect(() => {
    api.get('/cost/summary').then(setSummary);
    api.get('/inventory/records?limit=10').then(setRecords);
  }, []);

  const recordColumns = [
    { title: '商品', dataIndex: 'product_name' },
    { title: 'SKU', dataIndex: 'sku' },
    {
      title: '类型',
      dataIndex: 'type',
      render: (v) => v === 'inbound' ? <Tag color="green">入库</Tag> : <Tag color="red">出库</Tag>,
    },
    { title: '数量', dataIndex: 'quantity' },
    { title: '操作人', dataIndex: 'operator_name' },
    { title: '时间', dataIndex: 'created_at' },
  ];

  return (
    <div>
      <h2>首页概览</h2>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic title="总商品数" value={summary.total_products || 0} prefix={<ShoppingOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="已上架" value={summary.active_products || 0} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="草稿" value={summary.draft_products || 0} prefix={<EditOutlined />} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
      </Row>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic title="总库存量" value={summary.total_stock || 0} prefix={<InboxOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="今日入库" value={summary.inbound_today || 0} prefix={<ArrowDownOutlined />} valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="今日出库" value={summary.outbound_today || 0} prefix={<ArrowUpOutlined />} valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
      </Row>
      <Card title="最近出入库记录">
        <Table dataSource={records} columns={recordColumns} rowKey="id" pagination={false} size="small" />
      </Card>
    </div>
  );
}
