import { Column, Line } from '@ant-design/plots';
import { GridContent } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { request } from '@umijs/max';
import { Button, Card, Col, DatePicker, Row, Space, Tabs, Tag } from 'antd';
import dayjs from 'dayjs';
import type { FC } from 'react';
import { useMemo, useState } from 'react';

/* ──────────────────────────────────────────────
   Types
   ────────────────────────────────────────────── */

type CountPair = {
  periodA: number;
  periodB: number;
};

type ApiResponseData = {
  front: CountPair[];
  back: CountPair[];
};

type ChartItem = {
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
  lineWidth: 3,
  smooth: false,
  point: {
    size: 2.5,
    shape: 'circle',
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
  const [dateA, setDateA] = useState<dayjs.Dayjs>(dayjs().subtract(60, 'day'));
  const [dateB, setDateB] = useState<dayjs.Dayjs>(dayjs());

  const {
    isLoading: loading,
    data: rawData,
    refetch,
  } = useQuery({
    queryKey: ['lottery-analysis'],
    queryFn: () =>
      request<{ data: ApiResponseData }>('/api/lottery_analysis').then(
        (res: any) => res.data,
      ),
  });

  const labels = activeTab === 'front' ? frontLabels : backLabels;
  const source = activeTab === 'front' ? rawData?.front : rawData?.back;

  /* ── Histogram data (two periods, grouped) ── */
  const chartData: ChartItem[] = useMemo(() => {
    if (!source) return [];
    return source.flatMap((item: CountPair, idx: number) => [
      { number: labels[idx], count: item.periodA, period: PERIOD_A_LABEL },
      { number: labels[idx], count: item.periodB, period: PERIOD_B_LABEL },
    ]);
  }, [source, labels]);

  /* ── Line-chart data (period A only) ── */
  const lineData: ChartItem[] = useMemo(() => {
    if (!source) return [];
    return source.map((item: CountPair, idx: number) => ({
      number: labels[idx],
      count: item.periodA,
      period: PERIOD_A_LABEL,
    }));
  }, [source, labels]);

  /* ── Ranking data (period A only, sorted desc) ── */
  const rankData: RankItem[] = useMemo(() => {
    if (!source) return [];
    return source
      .map((item: CountPair, idx: number) => ({
        number: labels[idx],
        count: item.periodA,
      }))
      .sort((a: RankItem, b: RankItem) => b.count - a.count);
  }, [source, labels]);

  /* ── Y-axis min ── */
  const yMin = useMemo(() => {
    if (chartData.length === 0) return 0;
    const values = chartData.map((d) => d.count);
    return Math.max(0, Math.min(...values) - 2);
  }, [chartData]);

  /* ── Ranking title ── */
  const rankingTitle =
    activeTab === 'front'
      ? '目标时间段前区号码出现次数排名'
      : '目标时间段后区号码出现次数排名';

  /* ── Line chart labels (sync with histogram tab) ── */
  const lineLabels = lineTab === 'front' ? frontLabels : backLabels;
  const lineSource = lineTab === 'front' ? rawData?.front : rawData?.back;

  const lineChartData: ChartItem[] = useMemo(() => {
    if (!lineSource) return [];
    return lineSource.map((item: CountPair, idx: number) => ({
      number: lineLabels[idx],
      count: item.periodA,
      period: PERIOD_A_LABEL,
    }));
  }, [lineSource, lineLabels]);

  const lineYMin = useMemo(() => {
    if (lineChartData.length === 0) return 0;
    const values = lineChartData.map((d) => d.count);
    return Math.max(0, Math.min(...values) - 2);
  }, [lineChartData]);

  /* ── Line card title ── */
  const lineCardTitle =
    lineTab === 'front'
      ? '前区号码出现次数折线图（时间段A）'
      : '后区号码出现次数折线图（时间段A）';

  const handleAnalyze = () => {
    refetch();
  };

  /* ── Tooltip formatter (shared) ── */
  const tooltipFormatter = (datum: any) => ({
    name: datum.period,
    value: `${datum.count}次`,
  });

  const lineTooltipFormatter = (_datum: any) => ({
    name: '出现次数',
    value: `${_datum.count}次`,
  });

  return (
    <GridContent>
      <Space
        direction="vertical"
        size={16}
        style={{ width: '100%', marginBottom: 16 }}
      >
        {/* ═══ Date picker row ═══ */}
        <Row justify="end" gutter={[16, 8]} wrap>
          <Col>
            <Space>
              <Tag color="blue">{PERIOD_A_LABEL}</Tag>
              <DatePicker
                value={dateA}
                onChange={(d) => d && setDateA(d)}
                variant="filled"
                style={{ width: 170 }}
              />
            </Space>
          </Col>
          <Col>
            <Space>
              <Tag color="red">{PERIOD_B_LABEL}</Tag>
              <DatePicker
                value={dateB}
                onChange={(d) => d && setDateB(d)}
                variant="filled"
                style={{ width: 170 }}
              />
              <Button type="primary" onClick={handleAnalyze} loading={loading}>
                一键分析
              </Button>
            </Space>
          </Col>
        </Row>

        {/* ═══ Main histogram card ═══ */}
        <Card variant="borderless">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'front',
                label: '前区号码出现次数（1-35）',
                children: (
                  <Row gutter={16}>
                    <Col xs={24} lg={16}>
                      <div style={{ padding: '0 0 24px 0' }}>
                        <Column
                          height={350}
                          data={chartData}
                          xField="number"
                          yField="count"
                          seriesField="period"
                          color={COLORS}
                          {...sharedColumnProps}
                          tooltip={{
                            showCrosshairs: true,
                            crosshairs: { type: 'x' },
                            shared: true,
                            formatter: tooltipFormatter,
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
                label: '后区号码出现次数（B01-B12）',
                children: (
                  <Row gutter={16}>
                    <Col xs={24} lg={16}>
                      <div style={{ padding: '0 0 24px 0' }}>
                        <Column
                          height={350}
                          data={chartData}
                          xField="number"
                          yField="count"
                          seriesField="period"
                          color={COLORS}
                          {...sharedColumnProps}
                          tooltip={{
                            showCrosshairs: true,
                            crosshairs: { type: 'x' },
                            shared: true,
                            formatter: tooltipFormatter,
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
          title={
            <Space>
              <span>时间段A的次数统计</span>
              <Tag color="blue" style={{ marginLeft: 8 }}>
                {PERIOD_A_LABEL}
              </Tag>
            </Space>
          }
        >
          <Tabs
            activeKey={lineTab}
            onChange={setLineTab}
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
                        showCrosshairs: true,
                        crosshairs: { type: 'x' },
                        formatter: lineTooltipFormatter,
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
                        showCrosshairs: true,
                        crosshairs: { type: 'x' },
                        formatter: lineTooltipFormatter,
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
