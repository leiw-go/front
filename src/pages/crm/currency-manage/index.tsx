import { ReloadOutlined } from '@ant-design/icons';
import { GridContent, PageContainer } from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Form,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
} from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import {
  convertCurrency,
  getCurrencySyncStatus,
  listCurrencies,
  listCurrencyRates,
  saveCurrencyRate,
  syncCurrencyRates,
  verifyCurrencyRates,
} from '@/services/crm/crmCurrency';
import { CURRENCIES, CURRENCY_STATUS, formatAmount } from '../shared';

const CurrencyManage: React.FC = () => {
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const [convertForm] = Form.useForm();
  const [rateForm] = Form.useForm();
  const [convertResult, setConvertResult] =
    useState<Crm.CrmCurrencyConvertDto>();

  const currenciesQuery = useQuery({
    queryKey: ['crm', 'currency', 'list'],
    queryFn: async () => {
      const res = await listCurrencies();
      return res?.data ?? [];
    },
  });

  const ratesQuery = useQuery({
    queryKey: ['crm', 'currency', 'rates'],
    queryFn: async () => {
      const res = await listCurrencyRates({});
      return res?.data ?? [];
    },
  });

  const syncStatusQuery = useQuery({
    queryKey: ['crm', 'currency', 'sync-status'],
    queryFn: async () => {
      const res = await getCurrencySyncStatus();
      return res?.data;
    },
  });

  const verificationQuery = useQuery({
    queryKey: ['crm', 'currency', 'verification'],
    queryFn: async () => {
      const res = await verifyCurrencyRates({});
      return res?.data ?? [];
    },
  });

  const convertMutation = useMutation({
    mutationFn: (params: Crm.convertCurrencyParams) => convertCurrency(params),
    onSuccess: (res) => {
      setConvertResult(res?.data);
      if (res?.data?.rateMissing) {
        messageApi.warning('未找到该日期的汇率，结果按 0 处理');
      }
    },
  });

  const saveRateMutation = useMutation({
    mutationFn: (body: Crm.CrmCurrencyRateRequest) => saveCurrencyRate(body),
    onSuccess: () => {
      messageApi.success('汇率已保存');
      queryClient.invalidateQueries({ queryKey: ['crm', 'currency'] });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => syncCurrencyRates(),
    onSuccess: () => {
      messageApi.success('汇率同步已触发');
      queryClient.invalidateQueries({ queryKey: ['crm', 'currency'] });
    },
  });

  const currencyOptions = CURRENCIES.map((code) => ({
    label: code,
    value: code,
  }));

  return (
    <PageContainer title="汇率管理">
      {contextHolder}
      <GridContent>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card variant="borderless" title="同步状态">
              <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                <Space size="large" wrap>
                  <Statistic
                    title="同步批次"
                    value={syncStatusQuery.data?.syncId ? '有' : '无'}
                    styles={{ value: { fontSize: 20 } }}
                  />
                  <Statistic
                    title="比对条数"
                    value={syncStatusQuery.data?.comparedCount ?? 0}
                    styles={{ value: { fontSize: 20 } }}
                  />
                  <Statistic
                    title="通过"
                    value={syncStatusQuery.data?.matchedCount ?? 0}
                    styles={{ value: { fontSize: 20 } }}
                  />
                  <Statistic
                    title="告警"
                    value={syncStatusQuery.data?.warnedCount ?? 0}
                    styles={{ value: { fontSize: 20 } }}
                  />
                  <Statistic
                    title="拒绝"
                    value={syncStatusQuery.data?.rejectedCount ?? 0}
                    styles={{ value: { fontSize: 20 } }}
                  />
                  <Statistic
                    title="入库"
                    value={syncStatusQuery.data?.savedCount ?? 0}
                    styles={{ value: { fontSize: 20 } }}
                  />
                </Space>
                <Space>
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    loading={syncMutation.isPending}
                    onClick={() => syncMutation.mutateAsync()}
                  >
                    立即同步汇率
                  </Button>
                  {syncStatusQuery.data?.stale ? (
                    <Tag color="warning">同步结果已过期</Tag>
                  ) : null}
                  {syncStatusQuery.data?.maxDeviationCurrency ? (
                    <span>
                      最大偏差：
                      {syncStatusQuery.data.maxDeviationCurrency}{' '}
                      {formatAmount(syncStatusQuery.data.maxDeviation)}%
                    </span>
                  ) : null}
                </Space>
              </Space>
            </Card>
          </Col>

          <Col span={24}>
            <Card variant="borderless">
              <Tabs
                defaultActiveKey="currency"
                items={[
                  {
                    key: 'currency',
                    label: '币种',
                    children: (
                      <Table<Crm.CrmCurrencyDto>
                        rowKey="id"
                        size="small"
                        pagination={false}
                        loading={currenciesQuery.isLoading}
                        dataSource={currenciesQuery.data ?? []}
                        columns={[
                          { title: '币种代码', dataIndex: 'currencyCode' },
                          { title: '名称', dataIndex: 'currencyName' },
                          { title: '符号', dataIndex: 'symbol' },
                          {
                            title: '分级',
                            dataIndex: 'currencyLevel',
                            render: (_, record) =>
                              record.currencyLevel === 'CORE'
                                ? '核心币种'
                                : '一般币种',
                          },
                          {
                            title: '状态',
                            dataIndex: 'status',
                            render: (_, record) => {
                              const status =
                                CURRENCY_STATUS[record.status ?? ''];
                              return status ? (
                                <Tag color={status.status}>{status.text}</Tag>
                              ) : (
                                '-'
                              );
                            },
                          },
                          {
                            title: '熔断天数',
                            dataIndex: 'suspectDays',
                          },
                        ]}
                      />
                    ),
                  },
                  {
                    key: 'rates',
                    label: '汇率',
                    children: (
                      <Space
                        orientation="vertical"
                        size={12}
                        style={{ width: '100%' }}
                      >
                        <Card size="small" title="手工维护汇率">
                          <Form
                            form={rateForm}
                            layout="inline"
                            onFinish={(values) =>
                              saveRateMutation.mutateAsync({
                                quoteCurrency: values.quoteCurrency,
                                rate: values.rate,
                                rateDate: values.rateDate
                                  ? dayjs(values.rateDate).format('YYYY-MM-DD')
                                  : undefined,
                              })
                            }
                          >
                            <Form.Item
                              name="quoteCurrency"
                              label="币种"
                              rules={[
                                { required: true, message: '请选择币种' },
                              ]}
                            >
                              <Select
                                options={currencyOptions}
                                style={{ width: 120 }}
                              />
                            </Form.Item>
                            <Form.Item
                              name="rate"
                              label="对 USD 汇率"
                              rules={[
                                { required: true, message: '请输入汇率' },
                              ]}
                            >
                              <InputNumber
                                style={{ width: 160 }}
                                step={0.0001}
                              />
                            </Form.Item>
                            <Form.Item name="rateDate" label="汇率日期">
                              <Input type="date" style={{ width: 160 }} />
                            </Form.Item>
                            <Form.Item>
                              <Button type="primary" htmlType="submit">
                                保存
                              </Button>
                            </Form.Item>
                          </Form>
                        </Card>
                        <Table<Crm.CrmCurrencyRateDto>
                          rowKey="id"
                          size="small"
                          pagination={{ pageSize: 10 }}
                          loading={ratesQuery.isLoading}
                          dataSource={ratesQuery.data ?? []}
                          columns={[
                            { title: '基准币种', dataIndex: 'baseCurrency' },
                            { title: '报价币种', dataIndex: 'quoteCurrency' },
                            {
                              title: '汇率',
                              dataIndex: 'rate',
                              render: (_, record) => formatAmount(record.rate),
                            },
                            { title: '汇率日期', dataIndex: 'rateDate' },
                            { title: '来源', dataIndex: 'source' },
                            { title: '交叉来源', dataIndex: 'crossSource' },
                            { title: '比对结果', dataIndex: 'crossStatus' },
                            {
                              title: '偏差率',
                              dataIndex: 'deviationRate',
                              render: (_, record) =>
                                record.deviationRate === undefined
                                  ? '-'
                                  : `${formatAmount(record.deviationRate)}%`,
                            },
                          ]}
                        />
                      </Space>
                    ),
                  },
                  {
                    key: 'convert',
                    label: '汇率换算',
                    children: (
                      <Space orientation="vertical" size={12}>
                        <Form
                          form={convertForm}
                          layout="inline"
                          initialValues={{
                            from: 'USD',
                            to: 'EUR',
                            amount: 100,
                          }}
                          onFinish={(values) =>
                            convertMutation.mutateAsync({
                              amount: values.amount,
                              from: values.from,
                              to: values.to,
                              date: values.date
                                ? dayjs(values.date).format('YYYY-MM-DD')
                                : undefined,
                            })
                          }
                        >
                          <Form.Item name="amount" label="金额">
                            <InputNumber style={{ width: 160 }} />
                          </Form.Item>
                          <Form.Item name="from" label="从">
                            <Select
                              options={currencyOptions}
                              style={{ width: 100 }}
                            />
                          </Form.Item>
                          <Form.Item name="to" label="到">
                            <Select
                              options={currencyOptions}
                              style={{ width: 100 }}
                            />
                          </Form.Item>
                          <Form.Item name="date" label="日期">
                            <Input type="date" style={{ width: 160 }} />
                          </Form.Item>
                          <Form.Item>
                            <Button type="primary" htmlType="submit">
                              换算
                            </Button>
                          </Form.Item>
                        </Form>
                        {convertResult ? (
                          <Descriptions column={2} bordered size="small">
                            <Descriptions.Item label="金额">
                              {formatAmount(convertResult.amount)}{' '}
                              {convertResult.fromCurrency}
                            </Descriptions.Item>
                            <Descriptions.Item label="汇率">
                              {formatAmount(convertResult.rate)}
                            </Descriptions.Item>
                            <Descriptions.Item label="折算结果">
                              {formatAmount(convertResult.convertedAmount)}{' '}
                              {convertResult.toCurrency}
                            </Descriptions.Item>
                            <Descriptions.Item label="汇率日期">
                              {convertResult.date ?? '-'}
                            </Descriptions.Item>
                          </Descriptions>
                        ) : null}
                      </Space>
                    ),
                  },
                  {
                    key: 'verification',
                    label: '两源比对明细',
                    children: (
                      <Table<Crm.CrmCurrencyRateCheckDto>
                        rowKey="id"
                        size="small"
                        pagination={{ pageSize: 10 }}
                        loading={verificationQuery.isLoading}
                        dataSource={verificationQuery.data ?? []}
                        columns={[
                          { title: '基准币种', dataIndex: 'baseCurrency' },
                          { title: '报价币种', dataIndex: 'quoteCurrency' },
                          {
                            title: '主源汇率',
                            dataIndex: 'primaryRate',
                            render: (_, record) =>
                              formatAmount(record.primaryRate),
                          },
                          {
                            title: '副源汇率',
                            dataIndex: 'secondaryRate',
                            render: (_, record) =>
                              formatAmount(record.secondaryRate),
                          },
                          {
                            title: '偏差率',
                            dataIndex: 'deviationRate',
                            render: (_, record) =>
                              record.deviationRate === undefined
                                ? '-'
                                : `${formatAmount(record.deviationRate)}%`,
                          },
                          {
                            title: '阈值',
                            dataIndex: 'threshold',
                            render: (_, record) =>
                              record.threshold === undefined
                                ? '-'
                                : `${formatAmount(record.threshold)}%`,
                          },
                          { title: '结论', dataIndex: 'checkResult' },
                          { title: '拒绝原因', dataIndex: 'rejectReason' },
                        ]}
                      />
                    ),
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

export default CurrencyManage;
