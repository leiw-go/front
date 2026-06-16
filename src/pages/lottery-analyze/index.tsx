import { Column, Line } from '@ant-design/plots';
import { GridContent } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { request } from '@umijs/max';
import { Button, Card, Col, DatePicker, Row, Space, Tabs, Tag } from 'antd';
import dayjs from 'dayjs';
import type { FC } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';

/* ──────────────────────────────────────────────
   Types
   ────────────────────────────────────────────── */

type MultiPeriodNumberStatistic = {
  number: string;
  counts: Record<string, number>;
  totalCount: number;
};

type MultiplePeriodStatisticsResponse = {
  periods: { label: string; totalPeriods: number }[];
  frontAreaStats: MultiPeriodNumberStatistic[];
  backAreaStats: MultiPeriodNumberStatistic[];
};

type StatsEntry = {
  number: string;
  count: number;
  period: string;
};

type RankItem = {
  number: string;
  count: number;
};

/* ──────────────────────────────────────────────
   Constants
   ────────────────────────────────────────────── */

const FRONT_NUMBERS = 35;
const BACK_NUMBERS = 12;

const PERIOD_A_LABEL = '目标搜索时间段';
const PERIOD_B_LABEL = '对比时间段';

const COLORS = ['#1890ff', '#f5222d'];

/** Build a label array: 01..35 or B01..B12 */
function buildLabels(count: number, prefix = ''): string[] {
  return Array.from({ length: count }, (_, i) =>
    prefix
      ? `${prefix}${String(i + 1).padStart(2, '0')}`
      : String(i + 1).padStart(2, '0'),
  );
}

const frontLabels = buildLabels(FRONT_NUMBERS);
const backLabels = buildLabels(BACK_NUMBERS, 'B');

/* ──────────────────────────────────────────────
   Shared histogram config
   ────────────────────────────────────────────── */

const sharedColumnProps = {
  isGroup: true,
  paddingBottom: 12,
  axis: {
    x: {
      title: { text: '彩票号码', style: { fontSize: 13 } } as const,
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

/* ──────────────────────────────────────────────
   Shared line-chart config
   ────────────────────────────────────────────── */

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
      title: { text: '彩票号码', style: { fontSize: 13 } } as const,
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
   Ranking sidebar component
   ────────────────────────────────────────────── */

const RankingSidebar: FC<{
  title: string;
  data: RankItem[];
}> = ({ title, data }) => (
  <div
    style={{
      maxHeight: 350,
      overflowY: 'auto',
      padding: '0 8px 0 16px',
    }}
  >
    <h4 style={{ marginBottom: 12, fontSize: 14, color: '#262626' }}>
      {title}
    </h4>
    {data.map((item, idx) => (
      <div
        key={item.number}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '5px 0',
          borderBottom: '1px dashed #f0f0f0',
          fontSize: 13,
        }}
      >
        <span>
          <span
            style={{
              display: 'inline-block',
              width: 20,
              textAlign: 'center',
              fontWeight: idx < 3 ? 700 : 400,
              color: idx < 3 ? '#1890ff' : '#595959',
              marginRight: 8,
            }}
          >
            {idx + 1}
          </span>
          {item.number}
        </span>
        <span style={{ color: '#262626', fontWeight: 500 }}>
          {item.count}次
        </span>
      </div>
    ))}
  </div>
);

/* ──────────────────────────────────────────────
   Main page
   ────────────────────────────────────────────── */

const LotteryAnalyze: FC = () => {
  const [activeTab, setActiveTab] = useState<string>('front');
  const [lineTab, setLineTab] = useState<string>('front');
  const [dateAStart, setDateAStart] = useState<dayjs.Dayjs>(dayjs().subtract(60, 'day'));
  const [dateAEnd, setDateAEnd] = useState<dayjs.Dayjs>(dayjs().subtract(30, 'day'));
  const [dateBStart, setDateBStart] = useState<dayjs.Dayjs>(dayjs().subtract(30, 'day'));
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
    queryKey: ['lottery-analysis', dateAStart.format('YYYY-MM-DD'), dateAEnd.format('YYYY-MM-DD'), dateBStart.format('YYYY-MM-DD'), dateBEnd.format('YYYY-MM-DD')],
    enabled: false,
    queryFn: () =>
      request('/api/lottery/statistics/multiple', {
        method: 'POST',
        data: {
          ranges: [
            { label: PERIOD_A_LABEL, startDate: dateAStart.format('YYYY-MM-DD'), endDate: dateAEnd.format('YYYY-MM-DD') },
            { label: PERIOD_B_LABEL, startDate: dateBStart.format('YYYY-MM-DD'), endDate: dateBEnd.format('YYYY-MM-DD') },
          ],
        },
      })
      .then((res: any) => res.data),
  });


  /* ── Histogram data (two periods, grouped) ── */
  const chartData: StatsEntry[] = useMemo(() => {
    if (!rawData) return [];
    const chStats = activeTab === 'front' ? rawData?.frontAreaStats : rawData?.backAreaStats;
    if (!chStats) return [];
    return [...chStats]
      .sort((a, b) => parseInt(a.number.replace(/^B/, ''), 10) - parseInt(b.number.replace(/^B/, ''), 10))
      .flatMap((item: MultiPeriodNumberStatistic) => [
      { number: item.number, count: item.counts[PERIOD_A_LABEL] || 0, period: PERIOD_A_LABEL },
      { number: item.number, count: item.counts[PERIOD_B_LABEL] || 0, period: PERIOD_B_LABEL },
    ]);
  }, [rawData, activeTab]);

  /* ── Line-chart data (period A only) ── */
  const lineData: StatsEntry[] = useMemo(() => {
    if (!rawData) return [];
    const ldStats = activeTab === 'front' ? rawData?.frontAreaStats : rawData?.backAreaStats;
    if (!ldStats) return [];
    return ldStats.map((item: MultiPeriodNumberStatistic) => ({
      number: item.number,
      count: item.counts[PERIOD_A_LABEL] || 0,
      period: PERIOD_A_LABEL,
    }));
  }, [rawData, activeTab]);

  /* ── Ranking data (period A only, sorted desc) ── */
  const rankData: RankItem[] = useMemo(() => {
    if (!rawData) return [];
    const stats = activeTab === 'front' ? rawData.frontAreaStats : rawData.backAreaStats;
    if (!stats) return [];
    return stats.map((item: MultiPeriodNumberStatistic) => ({
        number: item.number,
        count: item.counts[PERIOD_A_LABEL] || 0,
      }))
      .sort((a: RankItem, b: RankItem) => b.count - a.count);
  }, [rawData, activeTab]);

  /* ── Y-axis min ── */
  const yMin = useMemo(() => {
    if (chartData.length === 0) return 0;
    const values = chartData.map((d: StatsEntry) => d.count);
    return Math.max(0, Math.min(...values) - 2);
  }, [chartData]);

  /* ── Ranking title ── */
  const rankingTitle =
    activeTab === 'front'
      ? '前区号码出现次数排名'
      : '后区号码出现次数排名';

  /* ── Line chart labels (sync with histogram tab) ── */

  const lineChartData: StatsEntry[] = useMemo(() => {
    if (!rawData) return [];
    const lcStats = lineTab === 'front' ? rawData?.frontAreaStats : rawData?.backAreaStats;
    if (!lcStats) return [];
    return [...lcStats]
      .sort((a, b) => parseInt(a.number.replace(/^B/, ''), 10) - parseInt(b.number.replace(/^B/, ''), 10))
      .map((item: MultiPeriodNumberStatistic) => ({
      number: item.number,
      count: item.counts[PERIOD_A_LABEL] || 0,
      period: PERIOD_A_LABEL,
    }));
  }, [rawData, lineTab]);

  const lineYMin = useMemo(() => {
    if (lineChartData.length === 0) return 0;
    const values = lineChartData.map((d: StatsEntry) => d.count);
    return Math.max(0, Math.min(...values) - 2);
  }, [lineChartData]);

  /* period summary */
  const periodSummary = useMemo(() => {
    if (!rawData?.periods || rawData.periods.length === 0) return { aText: '', bText: '' };
    const periodA = rawData.periods.find((p: { label: string; totalPeriods: number }) => p.label === PERIOD_A_LABEL);
    const periodB = rawData.periods.find((p: { label: string; totalPeriods: number }) => p.label === PERIOD_B_LABEL);
    const aCount = periodA ? periodA.totalPeriods : 0;
    const bCount = periodB ? periodB.totalPeriods : 0;
    return {
      aText: aCount > 0 ? aCount + '期' : '',
      bText: bCount > 0 ? bCount + '期' : '',
    };
  }, [rawData]);

  const handleAnalyze = () => {
    refetch();
  };

  /* ── Tooltip formatter (shared) ── */  return (
    <GridContent>
      <Space
        direction="vertical"
        size={16}
        style={{ width: '100%', marginBottom: 16 }}
      >
        {/* ═══ Date picker row ═══ */}


        {/* ═══ Main histogram card ═══ */}
        <Card variant="borderless">

                      <Row justify="end" gutter={[16, 8]} wrap>
          <Col>
            <Space>
              {periodSummary.aText && <Tag color="blue">目标时间段期数：{periodSummary.aText}</Tag>}
              {periodSummary.bText && <Tag color="red">对比时间段期数：{periodSummary.bText}</Tag>}
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
              <Button type="primary" onClick={handleAnalyze} loading={loading}>
                一键分析
              </Button>
            </Space>
          </Col>
        </Row>
<Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            destroyInactiveTabPane
            items={[
              {
                key: 'front',
                label: '前区号码出现次数（01-35）',
                children: (
                  <Row gutter={16}>
                    <Col xs={24} lg={16}>
                      <div style={{ padding: '0 0 24px 0' }}>
                        <Column key={activeTab}
                          height={350}
                          data={chartData}
                          xField="number"
                          yField="count"
                          seriesField="period"
                          color={COLORS}
                          {...sharedColumnProps}
                          tooltip={{
                            title: (d: any) => d.number + '号',
                            items: [
                              { channel: 'y', valueFormatter: (d: any) => d + '次' },
                            ],
                          }}
                          scale={{
                            ...sharedColumnProps.scale,
                            y: { min: yMin, nice: true },
                          }}
                        />
                      </div>
                    </Col>
                    <Col xs={24} lg={8}>
                      <RankingSidebar title={rankingTitle} data={rankData} />
                    </Col>
                  </Row>
                ),
              },
              {
                key: 'back',
                label: '后区号码出现次数（01-12）',
                children: (
                  <Row gutter={16}>
                    <Col xs={24} lg={16}>
                      <div style={{ padding: '0 0 24px 0' }}>
                        <Column key={activeTab}
                          height={350}
                          data={chartData}
                          xField="number"
                          yField="count"
                          seriesField="period"
                          color={COLORS}
                          {...sharedColumnProps}
                          tooltip={{
                            title: (d: any) => d.number + '号',
                            items: [
                              { channel: 'y', valueFormatter: (d: any) => d + '次' },
                            ],
                          }}
                          scale={{
                            ...sharedColumnProps.scale,
                            y: { min: yMin, nice: true },
                          }}
                        />
                      </div>
                    </Col>
                    <Col xs={24} lg={8}>
                      <RankingSidebar title={rankingTitle} data={rankData} />
                    </Col>
                  </Row>
                ),
              },
            ]}
          />
        </Card>

        {/* ═══ Line-chart card ═══ */}
        <Card
          variant="borderless"

        >
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
                      data={lineChartData}
                      xField="number"
                      yField="count"
                      color={['#1890ff']}
                      {...sharedLineProps}
                      tooltip={{
                        title: (d: any) => d.number + '号',
                        items: [
                          { channel: 'y', valueFormatter: (d: any) => d + '次' },
                        ],
                      }}
                      scale={{
                        y: { min: lineYMin, nice: true },
                      }}
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
                      data={lineChartData}
                      xField="number"
                      yField="count"
                      color={['#1890ff']}
                      {...sharedLineProps}
                      tooltip={{
                        title: (d: any) => d.number + '号',
                        items: [
                          { channel: 'y', valueFormatter: (d: any) => d + '次' },
                        ],
                      }}
                      scale={{
                        y: { min: lineYMin, nice: true },
                      }}
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
