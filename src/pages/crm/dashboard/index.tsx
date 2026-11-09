import { Line } from '@ant-design/plots';
import { GridContent, PageContainer } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { Card, Col, Progress, Row, Statistic, Table, Tabs } from 'antd';
import { useState } from 'react';
import {
  dashboardCustomerSource,
  dashboardPipeline,
  dashboardReceivableAging,
  dashboardSummary,
  dashboardTopProducts,
  dashboardTrend,
} from '@/services/crm/crmDashboard';
import { CUSTOMER_SOURCES, formatAmount } from '../shared';

const CrmDashboard: React.FC = () => {
  const [granularity, setGranularity] = useState<'MONTH' | 'QUARTER'>('MONTH');

  const summaryQuery = useQuery({
    queryKey: ['crm', 'dashboard', 'summary'],
    queryFn: async () => {
      const res = await dashboardSummary();
      return res?.data;
    },
  });

  const pipelineQuery = useQuery({
    queryKey: ['crm', 'dashboard', 'pipeline'],
    queryFn: async () => {
      const res = await dashboardPipeline();
      return res?.data;
    },
  });

  const trendQuery = useQuery({
    queryKey: ['crm', 'dashboard', 'trend', granularity],
    queryFn: async () => {
      const res = await dashboardTrend({ granularity, periods: 6 });
      return res?.data ?? [];
    },
  });

  const agingQuery = useQuery({
    queryKey: ['crm', 'dashboard', 'receivable-aging'],
    queryFn: async () => {
      const res = await dashboardReceivableAging();
      return res?.data;
    },
  });

  const topProductsQuery = useQuery({
    queryKey: ['crm', 'dashboard', 'top-products'],
    queryFn: async () => {
      const res = await dashboardTopProducts({ limit: 10 });
      return res?.data ?? [];
    },
  });

  const sourceQuery = useQuery({
    queryKey: ['crm', 'dashboard', 'customer-source'],
    queryFn: async () => {
      const res = await dashboardCustomerSource();
      return res?.data ?? [];
    },
  });

  const summary = summaryQuery.data;
  const pipeline = pipelineQuery.data;
  const trend = trendQuery.data ?? [];
  const sources = sourceQuery.data ?? [];
  const aging = agingQuery.data;
  const topProducts = topProductsQuery.data ?? [];

  const trendData = trend.flatMap((item) => [
    {
      period: item.period,
      metric: '新增客户数',
      value: item.newCustomerCount ?? 0,
    },
    {
      period: item.period,
      metric: '新增商机数',
      value: item.newOpportunityCount ?? 0,
    },
  ]);

  const winRateData = trend.map((item) => ({
    period: item.period,
    metric: '赢单率 %',
    value: item.winRate ?? 0,
  }));

  return (
    <PageContainer title="CRM 看板">
      <GridContent>
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card variant="borderless">
              <Statistic
                title="本月成交额"
                value={summary?.monthDealAmount ?? 0}
                precision={2}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card variant="borderless">
              <Statistic
                title="活跃客户数"
                value={summary?.activeCustomerCount ?? 0}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card variant="borderless">
              <Statistic
                title="进行中商机"
                value={summary?.openOpportunityCount ?? 0}
                suffix={
                  <span style={{ fontSize: 14, marginLeft: 8 }}>
                    合计 {formatAmount(summary?.openOpportunityAmountBase)} USD
                  </span>
                }
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card variant="borderless">
              <Statistic
                title="逾期应收"
                value={summary?.overdueReceivableAmount ?? 0}
                precision={2}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={12}>
            <Card variant="borderless" title="销售漏斗">
              <div style={{ marginBottom: 12 }}>
                商机总数 {pipeline?.totalCount ?? 0} ，赢单率{' '}
                {pipeline?.winRate ?? 0}% ，合计金额{' '}
                {formatAmount(pipeline?.totalAmountBase)} USD
              </div>
              <Table<Crm.StageBucket>
                rowKey="stage"
                size="small"
                pagination={false}
                loading={pipelineQuery.isLoading}
                dataSource={pipeline?.stages ?? []}
                columns={[
                  { title: '阶段', dataIndex: 'stageName' },
                  { title: '数量', dataIndex: 'count', width: 80 },
                  {
                    title: '金额（USD）',
                    dataIndex: 'amountBase',
                    render: (_, record) => formatAmount(record.amountBase),
                  },
                  {
                    title: '转化率',
                    dataIndex: 'conversionRate',
                    render: (_, record) => (
                      <Progress
                        percent={Number(record.conversionRate ?? 0)}
                        size="small"
                      />
                    ),
                  },
                ]}
              />
            </Card>
          </Col>

          <Col span={12}>
            <Card variant="borderless" title="业绩趋势">
              <Tabs
                activeKey={granularity}
                onChange={(key) => setGranularity(key as 'MONTH' | 'QUARTER')}
                items={[
                  {
                    key: 'MONTH',
                    label: '按月',
                    children: (
                      <Line
                        height={260}
                        data={trendData}
                        xField="period"
                        yField="value"
                        colorField="metric"
                        shapeField="smooth"
                        point={{ sizeField: 3 }}
                      />
                    ),
                  },
                  {
                    key: 'QUARTER',
                    label: '按季',
                    children: (
                      <Line
                        height={260}
                        data={trendData}
                        xField="period"
                        yField="value"
                        colorField="metric"
                        shapeField="smooth"
                        point={{ sizeField: 3 }}
                      />
                    ),
                  },
                ]}
              />
              <Line
                height={200}
                data={winRateData}
                xField="period"
                yField="value"
                color={['#52c41a']}
                shapeField="smooth"
                point={{ sizeField: 3 }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={12}>
            <Card variant="borderless" title="应收账龄">
              <div style={{ marginBottom: 12 }}>
                未回款 {aging?.totalCount ?? 0} 笔，合计{' '}
                {formatAmount(aging?.totalAmountBase)} USD
              </div>
              <Table<Crm.CrmReceivableAgingBucketDto>
                rowKey="bucket"
                size="small"
                pagination={false}
                loading={agingQuery.isLoading}
                dataSource={aging?.buckets ?? []}
                columns={[
                  { title: '账龄', dataIndex: 'label' },
                  { title: '笔数', dataIndex: 'count' },
                  {
                    title: '金额（USD）',
                    dataIndex: 'amountBase',
                    render: (_, record) => formatAmount(record.amountBase),
                  },
                ]}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card variant="borderless" title="产品成交排行">
              <Table<Crm.CrmDashboardTopProductDto>
                rowKey="productId"
                size="small"
                pagination={false}
                loading={topProductsQuery.isLoading}
                dataSource={topProducts}
                columns={[
                  { title: '产品', dataIndex: 'productName' },
                  { title: '编码', dataIndex: 'productCode' },
                  {
                    title: '成交金额（USD）',
                    dataIndex: 'dealAmountBase',
                    render: (_, record) => formatAmount(record.dealAmountBase),
                  },
                  { title: '数量', dataIndex: 'dealQuantity' },
                  { title: '订单数', dataIndex: 'orderCount' },
                ]}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card variant="borderless" title="客户来源分布">
              <Table<Crm.CrmDashboardCustomerSourceDto>
                rowKey="source"
                size="small"
                pagination={false}
                loading={sourceQuery.isLoading}
                dataSource={sources}
                columns={[
                  {
                    title: '来源渠道',
                    dataIndex: 'source',
                    render: (_, record) =>
                      CUSTOMER_SOURCES.find(
                        (item) => item.value === record.source,
                      )?.label ?? record.source,
                  },
                  { title: '客户数', dataIndex: 'customerCount' },
                  { title: '商机数', dataIndex: 'opportunityCount' },
                  {
                    title: '商机金额（USD）',
                    dataIndex: 'opportunityAmountBase',
                    render: (_, record) =>
                      formatAmount(record.opportunityAmountBase),
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>
      </GridContent>
    </PageContainer>
  );
};

export default CrmDashboard;
