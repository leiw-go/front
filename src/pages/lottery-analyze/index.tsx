import { Column, Line } from '@ant-design/plots';
import { GridContent } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { request } from '@umijs/max';
import type { TableColumnsType } from 'antd';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Progress,
  Row,
  Space,
  Table,
  Tabs,
  Tag,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useRef, useState } from 'react';

/* ──────────────────────────────────────────────
   Types
   ────────────────────────────────────────────── */

type MultiPeriodNumberStatistic = {
  number: string;
  counts: Record<string, number>;
  probabilities: Record<string, string>;
  totalCount: number;
};

type StatsEntry = {
  number: string;
  count: number;
  period: string;
};

type RankItem = {
  number: string;
  count: number;
  probability: string;
  percentage: number;
};

/* ──────────────────────────────────────────────
   Constants
   ────────────────────────────────────────────── */

const PERIOD_A_LABEL = '目标搜索时间段';
const PERIOD_B_LABEL = '对比时间段';

const _COLORS: Record<string, string> = {
  [PERIOD_A_LABEL]: '#1890ff',
  [PERIOD_B_LABEL]: '#f5222d',
};

/* ──────────────────────────────────────────────
   Shared configs
   ────────────────────────────────────────────── */

const sharedColumnProps = {
  isGroup: true,
  paddingBottom: 12,
  axis: {
    x: {
      label: {
        autoRotate: false,
        autoHide: true,
        style: { fontSize: 11 },
      },
    },
    y: {
      title: { text: '出现次数', style: { fontSize: 13 } } as const,
      gridLineDash: null as unknown as undefined,
      gridStroke: '#ccc',
    },
  },
  scale: {
    x: { paddingInner: 0.4 },
  },
  legend: {
    layout: 'horizontal' as const,
    position: 'top-left' as const,
  },
};

const sharedLineProps = {
  smooth: false,
  point: {
    size: 2.5,
    shape: 'circle',
  },
  style: {
    lineWidth: 3,
  },
  axis: {
    x: {
      label: {
        autoRotate: false,
        autoHide: true,
        style: { fontSize: 11 },
      },
    },
    y: {
      title: { text: '出现次数', style: { fontSize: 13 } } as const,
      gridLineDash: null as unknown as undefined,
      gridStroke: '#ccc',
    },
  },
  legend: false,
};

/* ──────────────────────────────────────────────
   Ranking Table Component
   ────────────────────────────────────────────── */

const RankingTable = ({
  title,
  data,
  periodColor,
}: {
  title: string;
  data: (RankItem & { index: number })[];
  periodColor: 'blue' | 'red';
}) => {
  const columns: TableColumnsType<RankItem & { index: number }> = [
    {
      title: '排名',
      dataIndex: 'index',
      key: 'index',
      width: 70,
      render: (val: number) => {
        if (val === 1) return <Tag color="gold">🥇 {val}</Tag>;
        if (val === 2) return <Tag color="lime">🥈 {val}</Tag>;
        if (val === 3) return <Tag color="cyan">🥉 {val}</Tag>;
        return <Tag>{val}</Tag>;
      },
    },
    {
      title: '号码',
      dataIndex: 'number',
      key: 'number',
      width: 80,
      render: (val: string) => (
        <Tag
          color={val.startsWith('B') ? 'red' : 'blue'}
          style={{ fontWeight: 600 }}
        >
          {val}
        </Tag>
      ),
    },
    {
      title: '出现次数',
      dataIndex: 'count',
      key: 'count',
      width: 100,
      sorter: (a, b) => a.count - b.count,
      render: (val: number) => <span style={{ fontWeight: 600 }}>{val}</span>,
    },
    {
      title: '出现概率',
      dataIndex: 'probability',
      key: 'probability',
      width: 180,
      render: (val: string, record: RankItem) => (
        <Progress
          percent={record.percentage}
          size="small"
          strokeColor={record.percentage > 5 ? '#1890ff' : '#ccc'}
          format={() => val}
        />
      ),
    },
  ];

  return (
    <Card
      variant="borderless"
      title={title}
      extra={
        <Tag color={periodColor}>
          {periodColor === 'blue' ? PERIOD_A_LABEL : PERIOD_B_LABEL}
        </Tag>
      }
      style={{ height: '100%' }}
      styles={{ body: { padding: '12px 16px' } }}
    >
      <Table<RankItem & { index: number }>
        rowKey="number"
        size="small"
        columns={columns}
        dataSource={data}
        pagination={false}
        scroll={{ y: 260 }}
      />
    </Card>
  );
};

/* ──────────────────────────────────────────────
   Main page
   ────────────────────────────────────────────── */

const LotteryAnalyze = () => {
  // 独立的 tab state
  const [rankTab, setRankTab] = useState<string>('front');
  const [chartTab, setChartTab] = useState<string>('front');
  const [lineTab, setLineTab] = useState<string>('front');

  const [dateAStart, setDateAStart] = useState<dayjs.Dayjs>(
    dayjs().subtract(60, 'day'),
  );
  const [dateAEnd, setDateAEnd] = useState<dayjs.Dayjs>(
    dayjs().subtract(30, 'day'),
  );
  const [dateBStart, setDateBStart] = useState<dayjs.Dayjs>(
    dayjs().subtract(30, 'day'),
  );
  const [dateBEnd, setDateBEnd] = useState<dayjs.Dayjs>(dayjs());

  /* auto-fetch on first visit */
  const didInit = useRef(false);
  useEffect(() => {
    if (!didInit.current) {
      didInit.current = true;
      refetch();
    }
  }, []);
  const {
    isLoading: loading,
    data: rawData,
    refetch,
  } = useQuery({
    queryKey: [
      'lottery-analysis',
      dateAStart.format('YYYY-MM-DD'),
      dateAEnd.format('YYYY-MM-DD'),
      dateBStart.format('YYYY-MM-DD'),
      dateBEnd.format('YYYY-MM-DD'),
    ],
    enabled: false,
    queryFn: () =>
      request('/api/lottery/statistics/multiple', {
        method: 'POST',
        data: {
          ranges: [
            {
              label: PERIOD_A_LABEL,
              startDate: dateAStart.format('YYYY-MM-DD'),
              endDate: dateAEnd.format('YYYY-MM-DD'),
            },
            {
              label: PERIOD_B_LABEL,
              startDate: dateBStart.format('YYYY-MM-DD'),
              endDate: dateBEnd.format('YYYY-MM-DD'),
            },
          ],
        },
      }).then((res: any) => res.data),
  });

  /* ── Histogram data (both periods grouped) ── */
  const frontChartData: StatsEntry[] = useMemo(() => {
    if (!rawData?.frontAreaStats) return [];
    return [...rawData.frontAreaStats]
      .sort((a, b) => parseInt(a.number, 10) - parseInt(b.number, 10))
      .flatMap((item: MultiPeriodNumberStatistic) => [
        {
          number: item.number,
          count: item.counts[PERIOD_A_LABEL] || 0,
          period: PERIOD_A_LABEL,
        },
        {
          number: item.number,
          count: item.counts[PERIOD_B_LABEL] || 0,
          period: PERIOD_B_LABEL,
        },
      ]);
  }, [rawData]);

  const backChartData: StatsEntry[] = useMemo(() => {
    if (!rawData?.backAreaStats) return [];
    return [...rawData.backAreaStats]
      .sort(
        (a, b) =>
          parseInt(a.number.replace(/^B/, ''), 10) -
          parseInt(b.number.replace(/^B/, ''), 10),
      )
      .flatMap((item: MultiPeriodNumberStatistic) => [
        {
          number: item.number,
          count: item.counts[PERIOD_A_LABEL] || 0,
          period: PERIOD_A_LABEL,
        },
        {
          number: item.number,
          count: item.counts[PERIOD_B_LABEL] || 0,
          period: PERIOD_B_LABEL,
        },
      ]);
  }, [rawData]);

  /* ── Ranking data (period A) ── */
  const frontRankDataA: (RankItem & { index: number })[] = useMemo(() => {
    if (!rawData?.frontAreaStats) return [];
    const sorted = [...rawData.frontAreaStats]
      .map((item: MultiPeriodNumberStatistic) => ({
        number: item.number,
        count: item.counts[PERIOD_A_LABEL] || 0,
        probability: item.probabilities?.[PERIOD_A_LABEL] || '0%',
        percentage: parseFloat(
          item.probabilities?.[PERIOD_A_LABEL]?.replace('%', '') || '0',
        ),
      }))
      .sort((a: RankItem, b: RankItem) => b.count - a.count);
    return sorted.map((item, idx) => ({ ...item, index: idx + 1 }));
  }, [rawData]);

  const backRankDataA: (RankItem & { index: number })[] = useMemo(() => {
    if (!rawData?.backAreaStats) return [];
    const sorted = [...rawData.backAreaStats]
      .map((item: MultiPeriodNumberStatistic) => ({
        number: item.number,
        count: item.counts[PERIOD_A_LABEL] || 0,
        probability: item.probabilities?.[PERIOD_A_LABEL] || '0%',
        percentage: parseFloat(
          item.probabilities?.[PERIOD_A_LABEL]?.replace('%', '') || '0',
        ),
      }))
      .sort((a: RankItem, b: RankItem) => b.count - a.count);
    return sorted.map((item, idx) => ({ ...item, index: idx + 1 }));
  }, [rawData]);

  /* ── Ranking data (period B) ── */
  const frontRankDataB: (RankItem & { index: number })[] = useMemo(() => {
    if (!rawData?.frontAreaStats) return [];
    const sorted = [...rawData.frontAreaStats]
      .map((item: MultiPeriodNumberStatistic) => ({
        number: item.number,
        count: item.counts[PERIOD_B_LABEL] || 0,
        probability: item.probabilities?.[PERIOD_B_LABEL] || '0%',
        percentage: parseFloat(
          item.probabilities?.[PERIOD_B_LABEL]?.replace('%', '') || '0',
        ),
      }))
      .sort((a: RankItem, b: RankItem) => b.count - a.count);
    return sorted.map((item, idx) => ({ ...item, index: idx + 1 }));
  }, [rawData]);

  const backRankDataB: (RankItem & { index: number })[] = useMemo(() => {
    if (!rawData?.backAreaStats) return [];
    const sorted = [...rawData.backAreaStats]
      .map((item: MultiPeriodNumberStatistic) => ({
        number: item.number,
        count: item.counts[PERIOD_B_LABEL] || 0,
        probability: item.probabilities?.[PERIOD_B_LABEL] || '0%',
        percentage: parseFloat(
          item.probabilities?.[PERIOD_B_LABEL]?.replace('%', '') || '0',
        ),
      }))
      .sort((a: RankItem, b: RankItem) => b.count - a.count);
    return sorted.map((item, idx) => ({ ...item, index: idx + 1 }));
  }, [rawData]);

  /* ── Line chart data ── */
  const frontLineData: StatsEntry[] = useMemo(() => {
    if (!rawData?.frontAreaStats) return [];
    return [...rawData.frontAreaStats]
      .sort((a, b) => parseInt(a.number, 10) - parseInt(b.number, 10))
      .map((item: MultiPeriodNumberStatistic) => ({
        number: item.number,
        count: item.counts[PERIOD_A_LABEL] || 0,
        period: PERIOD_A_LABEL,
      }));
  }, [rawData]);

  const backLineData: StatsEntry[] = useMemo(() => {
    if (!rawData?.backAreaStats) return [];
    return [...rawData.backAreaStats]
      .sort(
        (a, b) =>
          parseInt(a.number.replace(/^B/, ''), 10) -
          parseInt(b.number.replace(/^B/, ''), 10),
      )
      .map((item: MultiPeriodNumberStatistic) => ({
        number: item.number,
        count: item.counts[PERIOD_A_LABEL] || 0,
        period: PERIOD_A_LABEL,
      }));
  }, [rawData]);

  /* ── Y-axis mins ── */
  const frontYMin = useMemo(() => {
    if (frontChartData.length === 0) return 0;
    const values = frontChartData.map((d) => d.count);
    return Math.max(0, Math.min(...values) - 2);
  }, [frontChartData]);

  const backYMin = useMemo(() => {
    if (backChartData.length === 0) return 0;
    const values = backChartData.map((d) => d.count);
    return Math.max(0, Math.min(...values) - 2);
  }, [backChartData]);

  const frontLineYMin = useMemo(() => {
    if (frontLineData.length === 0) return 0;
    const values = frontLineData.map((d) => d.count);
    return Math.max(0, Math.min(...values) - 2);
  }, [frontLineData]);

  const backLineYMin = useMemo(() => {
    if (backLineData.length === 0) return 0;
    const values = backLineData.map((d) => d.count);
    return Math.max(0, Math.min(...values) - 2);
  }, [backLineData]);

  /* ── Period summary ── */
  const periodSummary = useMemo(() => {
    if (!rawData?.periods || rawData.periods.length === 0)
      return { aText: '', bText: '' };
    const periodA = rawData.periods.find(
      (p: { label: string; totalPeriods: number }) =>
        p.label === PERIOD_A_LABEL,
    );
    const periodB = rawData.periods.find(
      (p: { label: string; totalPeriods: number }) =>
        p.label === PERIOD_B_LABEL,
    );
    return {
      aText: periodA ? `${periodA.totalPeriods}期` : '',
      bText: periodB ? `${periodB.totalPeriods}期` : '',
    };
  }, [rawData]);

  const handleAnalyze = () => {
    refetch();
  };

  return (
    <GridContent>
      <Space
        direction="vertical"
        size={16}
        style={{ width: '100%', marginBottom: 16 }}
      >
        {/* Date picker row */}
        <Card variant="borderless">
          <Row justify="end" gutter={[16, 8]} wrap>
            <Col>
              <Space>
                {periodSummary.aText && (
                  <Tag color="blue">目标时间段期数：{periodSummary.aText}</Tag>
                )}
                {periodSummary.bText && (
                  <Tag color="red">对比时间段期数：{periodSummary.bText}</Tag>
                )}
                <Tag color="blue">{PERIOD_A_LABEL}</Tag>
                <DatePicker
                  value={dateAStart}
                  onChange={(d) => d && setDateAStart(d)}
                  variant="filled"
                  style={{ width: 150 }}
                />
                <span style={{ margin: '0 4px', color: '#999' }}>~</span>
                <DatePicker
                  value={dateAEnd}
                  onChange={(d) => d && setDateAEnd(d)}
                  variant="filled"
                  style={{ width: 150 }}
                />
              </Space>
            </Col>
            <Col>
              <Space>
                <Tag color="red">{PERIOD_B_LABEL}</Tag>
                <DatePicker
                  value={dateBStart}
                  onChange={(d) => d && setDateBStart(d)}
                  variant="filled"
                  style={{ width: 150 }}
                />
                <span style={{ margin: '0 4px', color: '#999' }}>~</span>
                <DatePicker
                  value={dateBEnd}
                  onChange={(d) => d && setDateBEnd(d)}
                  variant="filled"
                  style={{ width: 150 }}
                />
                <Button
                  type="primary"
                  onClick={handleAnalyze}
                  loading={loading}
                >
                  一键分析
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Rankings Card - with independent tab */}
        <Card variant="borderless">
          <Tabs
            activeKey={rankTab}
            onChange={setRankTab}
            destroyInactiveTabPane
            items={[
              {
                key: 'front',
                label: '前区号码（01-35）',
                children: (
                  <Row gutter={16}>
                    <Col xs={24} lg={12}>
                      <RankingTable
                        title="目标时间段"
                        data={frontRankDataA}
                        periodColor="blue"
                      />
                    </Col>
                    <Col xs={24} lg={12}>
                      <RankingTable
                        title="对比时间段"
                        data={frontRankDataB}
                        periodColor="red"
                      />
                    </Col>
                  </Row>
                ),
              },
              {
                key: 'back',
                label: '后区号码（B01-B12）',
                children: (
                  <Row gutter={16}>
                    <Col xs={24} lg={12}>
                      <RankingTable
                        title="目标时间段"
                        data={backRankDataA}
                        periodColor="blue"
                      />
                    </Col>
                    <Col xs={24} lg={12}>
                      <RankingTable
                        title="对比时间段"
                        data={backRankDataB}
                        periodColor="red"
                      />
                    </Col>
                  </Row>
                ),
              },
            ]}
          />
        </Card>

        {/* Histogram Card - with independent tab */}
        <Card variant="borderless">
          <Tabs
            activeKey={chartTab}
            onChange={setChartTab}
            destroyInactiveTabPane
            items={[
              {
                key: 'front',
                label: '前区号码出现次数（01-35）',
                children: (
                  <div style={{ padding: '0 0 24px 0' }}>
                    <Column
                      key={chartTab}
                      height={350}
                      data={frontChartData}
                      xField="number"
                      yField="count"
                      seriesField="period"
                      color={['#1890ff', '#f5222d']}
                      {...sharedColumnProps}
                      tooltip={{
                        title: (d: any) => `${d.number}号`,
                        items: [
                          {
                            channel: 'y',
                            valueFormatter: (d: any) => `${d}次`,
                          },
                        ],
                      }}
                      scale={{
                        ...sharedColumnProps.scale,
                        color: { range: ['#1890ff', '#f5222d'] },
                        y: { min: frontYMin, nice: true },
                      }}
                    />
                  </div>
                ),
              },
              {
                key: 'back',
                label: '后区号码出现次数（B01-B12）',
                children: (
                  <div style={{ padding: '0 0 24px 0' }}>
                    <Column
                      key={chartTab}
                      height={350}
                      data={backChartData}
                      xField="number"
                      yField="count"
                      seriesField="period"
                      color={['#1890ff', '#f5222d']}
                      {...sharedColumnProps}
                      tooltip={{
                        title: (d: any) => `${d.number}号`,
                        items: [
                          {
                            channel: 'y',
                            valueFormatter: (d: any) => `${d}次`,
                          },
                        ],
                      }}
                      scale={{
                        ...sharedColumnProps.scale,
                        color: { range: ['#1890ff', '#f5222d'] },
                        y: { min: backYMin, nice: true },
                      }}
                    />
                  </div>
                ),
              },
            ]}
          />
        </Card>

        {/* Line chart card */}
        <Card variant="borderless">
          <Tabs
            activeKey={lineTab}
            onChange={setLineTab}
            destroyInactiveTabPane
            items={[
              {
                key: 'front',
                label: '前区号码出现次数折线图',
                children: (
                  <div style={{ padding: '0 0 24px 0' }}>
                    <Line
                      height={300}
                      data={frontLineData}
                      xField="number"
                      yField="count"
                      color={['#1890ff']}
                      {...sharedLineProps}
                      tooltip={{
                        title: (d: any) => `${d.number}号`,
                        items: [
                          {
                            channel: 'y',
                            valueFormatter: (d: any) => `${d}次`,
                          },
                        ],
                      }}
                      scale={{ y: { min: frontLineYMin, nice: true } }}
                    />
                  </div>
                ),
              },
              {
                key: 'back',
                label: '后区号码出现次数折线图',
                children: (
                  <div style={{ padding: '0 0 24px 0' }}>
                    <Line
                      height={300}
                      data={backLineData}
                      xField="number"
                      yField="count"
                      color={['#f5222d']}
                      {...sharedLineProps}
                      tooltip={{
                        title: (d: any) => `${d.number}号`,
                        items: [
                          {
                            channel: 'y',
                            valueFormatter: (d: any) => `${d}次`,
                          },
                        ],
                      }}
                      scale={{ y: { min: backLineYMin, nice: true } }}
                    />
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </Space>
    </GridContent>
  );
};

export default LotteryAnalyze;
