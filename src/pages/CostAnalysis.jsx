import React, { useState, useEffect } from 'react';
import { Table, Card, Row, Col, Statistic, InputNumber, Button, message, Space } from 'antd';
import { DollarOutlined, WarningOutlined } from '@ant-design/icons';
import api from '../api';
import { getUser } from '../utils/auth';

export default function CostAnalysis() {
  const [data, setData] = useState([]);
  const [feeRate, setFeeRate] = useState(0.05);
  const [editRate, setEditRate] = useState(0.05);
  const [loading, setLoading] = useState(false);
  const user = getUser();
  const canEditRate = ['admin', 'finance'].includes(user?.role);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [analysis, settings] = await Promise.all([
        api.get('/cost/analysis'),
        api.get('/cost/settings'),
      ]);
      setData(analysis);
      setFeeRate(settings.platform_fee_rate);
      setEditRate(settings.platform_fee_rate);
    } catch {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveRate = async () => {
    try {
      await api.put('/cost/settings', { platform_fee_rate: editRate });
      message.success('费率更新成功');
      fetchData();
    } catch (err) {
      message.error(err.error || '更新失败');
    }
  };

  const totalProfit = data.reduce((sum, item) => sum + item.gross_profit * item.stock_quantity, 0);
  const avgRate = data.length ? data.reduce((sum, item) => sum + item.gross_profit_rate, 0) / data.length : 0;
  const lowProfitItems = data.filter(item => item.gross_profit_rate < 10);

  const columns = [
    { title: '商品名称', dataIndex: 'name', ellipsis: true },
    { title: 'SKU', dataIndex: 'sku', width: 100 },
    { title: '分类', dataIndex: 'category', width: 80 },
    { title: '采购价', dataIndex: 'purchase_price', width: 80, render: v => `¥${v}` },
    { title: '运费', dataIndex: 'shipping_cost', width: 70, render: v => `¥${v}` },
    { title: '平台费', dataIndex: 'platform_fee', width: 80, render: v => `¥${v}` },
    { title: '售价', dataIndex: 'selling_price', width: 80, render: v => `¥${v}` },
    {
      title: '单件毛利', dataIndex: 'gross_profit', width: 90,
      render: v => <span style={{ color: v >= 0 ? '#3f8600' : '#cf1322' }}>¥{v}</span>,
    },
    {
      title: '毛利率', dataIndex: 'gross_profit_rate', width: 90,
      render: v => (
        <span style={{ color: v >= 20 ? '#3f8600' : v >= 10 ? '#d48806' : '#cf1322' }}>
          {v}%
        </span>
      ),
    },
    { title: '库存', dataIndex: 'stock_quantity', width: 70 },
    {
      title: '库存总利润', width: 110,
      render: (_, record) => {
        const total = record.gross_profit * record.stock_quantity;
        return <span style={{ color: total >= 0 ? '#3f8600' : '#cf1322' }}>¥{total.toFixed(2)}</span>;
      },
    },
  ];

  return (
    <div>
      <h2>成本分析</h2>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="当前平台费率" value={(feeRate * 100).toFixed(1)} suffix="%" prefix={<DollarOutlined />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="上架商品数" value={data.length} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="平均毛利率" value={avgRate.toFixed(1)} suffix="%" valueStyle={{ color: avgRate >= 20 ? '#3f8600' : '#cf1322' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="低毛利商品" value={lowProfitItems.length} prefix={<WarningOutlined />} valueStyle={{ color: lowProfitItems.length > 0 ? '#cf1322' : '#3f8600' }} />
          </Card>
        </Col>
      </Row>

      {canEditRate && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space>
            <span>调整平台费率：</span>
            <InputNumber
              min={0} max={99} precision={1}
              value={editRate * 100}
              onChange={v => setEditRate((v || 0) / 100)}
              formatter={v => `${v}%`}
              parser={v => v.replace('%', '')}
              style={{ width: 120 }}
            />
            <Button type="primary" onClick={handleSaveRate}>保存</Button>
          </Space>
        </Card>
      )}

      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        loading={loading}
        size="small"
        scroll={{ x: 1200 }}
        summary={() => (
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={7}><strong>合计</strong></Table.Summary.Cell>
              <Table.Summary.Cell index={7} colSpan={4}></Table.Summary.Cell>
              <Table.Summary.Cell index={11}>
                <strong style={{ color: totalProfit >= 0 ? '#3f8600' : '#cf1322' }}>
                  ¥{totalProfit.toFixed(2)}
                </strong>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />
    </div>
  );
}
