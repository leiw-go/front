import {
  CalculatorOutlined,
  DeleteOutlined,
  PlusOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useMutation, useQuery } from '@tanstack/react-query';
import { history } from '@umijs/max';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Divider,
  Form,
  InputNumber,
  message,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Tooltip,
} from 'antd';
import type dayjs from 'dayjs';
import { useMemo, useRef, useState } from 'react';
import ActionButton from '@/components/ActionButton';
import { getCrmCountryInfo } from '@/services/crm/crmCountry';
import { calculate, createQuotation } from '@/services/crm/crmQuotation';
import {
  useCountryOptions,
  useCustomerOptions,
  useProductOptions,
} from '../hooks/useOptions';
import { CURRENCIES, INCOTERMS } from '../shared';
import { type PricingLineInput, priceQuote } from './pricing';

interface LineFormValue {
  /** 行标识，仅用于前端渲染 key，不参与算价 */
  rowKey?: string;
  productId?: string;
  quantity?: number;
  markupRate?: number;
  discountRate?: number;
  manualPrice?: boolean;
  manualUnitPrice?: number;
}

/** 与后端试算结果的逐行对照 */
interface CompareRow {
  index: number;
  localUnitPrice: number;
  serverUnitPrice?: number;
  localAmount: number;
  serverAmount?: number;
  same: boolean;
}

interface FormValues {
  currencyCode?: string;
  markupRate?: number;
  discountRate?: number;
  incoterm?: string;
  customerId?: string;
  validUntil?: dayjs.Dayjs;
  items?: LineFormValue[];
}

/** 与后端比较时的容差（后端单价保留 6 位小数） */
const EPSILON = 1e-6;

/** 单价展示（6 位小数） */
const unit = (value?: number) => (value ?? 0).toFixed(6);
/** 金额展示（2 位小数） */
const money = (value?: number) => (value ?? 0).toFixed(2);

/** 对照表列定义 */
const compareColumns = [
  { title: '行', dataIndex: 'index', width: 60 },
  {
    title: '本地单价',
    dataIndex: 'localUnitPrice',
    width: 130,
    render: (value: number) => unit(value),
  },
  {
    title: '后端单价',
    dataIndex: 'serverUnitPrice',
    width: 130,
    render: (value?: number) => unit(value),
  },
  {
    title: '本地金额',
    dataIndex: 'localAmount',
    width: 120,
    render: (value: number) => money(value),
  },
  {
    title: '后端金额',
    dataIndex: 'serverAmount',
    width: 120,
    render: (value?: number) => money(value),
  },
  {
    title: '一致',
    dataIndex: 'same',
    width: 80,
    render: (same: boolean) =>
      same ? <Tag color="success">一致</Tag> : <Tag color="error">不一致</Tag>,
  },
];

const QuotationCalculator: React.FC = () => {
  const [form] = Form.useForm<FormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const { options: customerOptions } = useCustomerOptions();
  const { options: productOptions } = useProductOptions();
  // 明细行的稳定标识：增删行时 React key 不跟着下标漂移
  const rowKeySeq = useRef(0);
  const nextRowKey = () => {
    rowKeySeq.current += 1;
    return `row-${rowKeySeq.current}`;
  };
  const [compared, setCompared] = useState<{
    rows: CompareRow[];
    serverTotalAmount?: number;
    serverTotalCost?: number;
    serverProfitAmount?: number;
    serverProfitRate?: number;
    totalSame: boolean;
  }>();
  /** 后端试算失败时的原因（如成本币种不一致、超过 MOQ 等） */
  const [compareError, setCompareError] = useState<string>();

  const currency = Form.useWatch('currencyCode', form) ?? 'USD';
  const markupRate = Form.useWatch('markupRate', form) ?? 0;
  const discountRate = Form.useWatch('discountRate', form) ?? 0;
  const watchedItems = Form.useWatch('items', form) as
    | LineFormValue[]
    | undefined;

  /** 买家国家：列表模糊搜索 + 国家详情（时区 / 时间 / 货币 / 汇率） */
  const [countryKeyword, setCountryKeyword] = useState('');
  const [countryCode, setCountryCode] = useState<string>();
  const { options: countryOptions, loading: countryLoading } =
    useCountryOptions(countryKeyword);

  const countryInfoQuery = useQuery({
    queryKey: ['crm', 'country-info', countryCode],
    queryFn: async () => {
      const res = await getCrmCountryInfo({ country: countryCode as string });
      return res?.data;
    },
    enabled: Boolean(countryCode),
    // 当前时间是后端按当地时区算的，定期刷新保持准确
    refetchInterval: 60_000,
  });
  const countryInfo = countryInfoQuery.data;

  /** 已选国家始终保留在下拉里，避免换关键词后选中的项显示成国家码 */
  const countrySelectOptions = useMemo(() => {
    if (
      !countryInfo ||
      countryOptions.some((option) => option.value === countryInfo.countryCode)
    ) {
      return countryOptions;
    }
    return [
      {
        label: `${countryInfo.countryNameZh ?? ''} ${
          countryInfo.countryName ?? ''
        } (${countryInfo.countryCode ?? ''})`,
        value: countryInfo.countryCode ?? '',
      },
      ...countryOptions,
    ];
  }, [countryInfo, countryOptions]);

  /** 当地行情面板：时区、时间、货币、汇率 */
  const countryInfoItems = useMemo(() => {
    if (!countryInfo) return [];
    const code = countryInfo.currencyCode ?? '';
    const symbol = countryInfo.currencySymbol ?? '';
    const rateMissing = countryInfo.rateMissing;
    // 汇率小数位多（如 1 JPY = 0.04211591 CNY），保留 8 位再去掉尾零
    const rate = (value?: number) =>
      value === undefined || value === null
        ? '-'
        : String(Number(value.toFixed(8)));
    return [
      {
        key: 'country',
        label: '国家',
        children: (
          <Space size={8}>
            <span>
              {countryInfo.countryNameZh ?? '-'} {countryInfo.countryName ?? ''}
            </span>
            <Tag>{countryInfo.countryCode}</Tag>
          </Space>
        ),
      },
      {
        key: 'timezone',
        label: '时区',
        children: (
          <Space size={8}>
            <span>{countryInfo.timezone ?? '-'}</span>
            {countryInfo.timezones ? (
              <Tooltip title={`全部时区：${countryInfo.timezones}`}>
                <Tag color="blue">
                  共 {countryInfo.timezones.split(',').length} 个
                </Tag>
              </Tooltip>
            ) : null}
          </Space>
        ),
      },
      {
        key: 'time',
        label: '当地当前时间',
        children: (
          <Space size={8}>
            <span>{countryInfo.currentTimeText ?? '-'}</span>
            <Tag>UTC{countryInfo.utcOffset ?? '-'}</Tag>
            {countryInfo.beijingOffsetText ? (
              <Tag color="cyan">{countryInfo.beijingOffsetText}</Tag>
            ) : null}
          </Space>
        ),
      },
      {
        key: 'currency',
        label: '主要货币',
        children: (
          <Space size={8}>
            <span>
              {symbol} {code} {countryInfo.currencyName ?? ''}
            </span>
            {code && code !== currency ? (
              <Button
                size="small"
                type="link"
                onClick={() => form.setFieldValue('currencyCode', code)}
              >
                设为报价币种
              </Button>
            ) : null}
          </Space>
        ),
      },
      {
        key: 'rateUsd',
        label: `对美元汇率${
          countryInfo.rateDate ? `（${countryInfo.rateDate}）` : ''
        }`,
        children: rateMissing ? (
          <Tag color="warning">该币种暂无汇率</Tag>
        ) : (
          <span style={{ fontFamily: 'monospace' }}>
            1 {code} = {rate(countryInfo.rateToUsd)} USD ｜ 1 USD ={' '}
            {rate(countryInfo.rateFromUsd)} {code}
          </span>
        ),
      },
      {
        key: 'rateCny',
        label: `对人民币汇率${
          countryInfo.rateDate ? `（${countryInfo.rateDate}）` : ''
        }`,
        children: rateMissing ? (
          <Tag color="warning">该币种暂无汇率</Tag>
        ) : (
          <span style={{ fontFamily: 'monospace' }}>
            1 {code} = {rate(countryInfo.rateToCny)} CNY ｜ 1 CNY ={' '}
            {rate(countryInfo.rateFromCny)} {code}
          </span>
        ),
      },
    ];
  }, [countryInfo, currency, form]);

  const productMap = useMemo(
    () =>
      new Map(productOptions.map((option) => [option.value, option.product])),
    [productOptions],
  );

  /** 把表单里的明细行转成算价引擎的输入（成本价来自产品档案） */
  const inputLines: PricingLineInput[] = useMemo(
    () =>
      (watchedItems ?? []).map((item) => {
        const product = item.productId
          ? productMap.get(item.productId)
          : undefined;
        return {
          rowKey: item.rowKey,
          productId: item.productId,
          productCode: product?.productCode,
          productName: product?.productName,
          costPrice: product?.costPrice ?? null,
          costCurrency: product?.costCurrency,
          moq: product?.moq ?? null,
          onSale: product ? product.productStatus === 1 : undefined,
          quantity: item.quantity ?? null,
          markupRate: item.markupRate ?? null,
          discountRate: item.discountRate ?? null,
          manualPrice: item.manualPrice,
          manualUnitPrice: item.manualUnitPrice ?? null,
        };
      }),
    [watchedItems, productMap],
  );

  const { lines: pricedLines, summary } = useMemo(
    () =>
      priceQuote(inputLines, {
        currency,
        markupRate,
        discountRate,
      }),
    [inputLines, currency, markupRate, discountRate],
  );

  const hasError = pricedLines.some((line) => line.errors.length > 0);

  /** 组装后端请求体：算价与保存报价单共用 */
  const buildRequest = (): Crm.CrmQuotationRequest => {
    const values = form.getFieldsValue();
    return {
      customerId: values.customerId,
      currencyCode: values.currencyCode ?? 'USD',
      incoterm: values.incoterm,
      markupRate: values.markupRate,
      discountRate: values.discountRate,
      validUntil: values.validUntil
        ? values.validUntil.format('YYYY-MM-DD')
        : undefined,
      items: (values.items ?? []).map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        markupRate: item.markupRate,
        discountRate: item.discountRate,
        manualPrice: item.manualPrice,
        unitPrice: item.manualPrice ? item.manualUnitPrice : undefined,
      })),
    };
  };

  const compareMutation = useMutation({
    mutationFn: async () => {
      const res = await calculate(buildRequest());
      if (res?.code !== 200) {
        throw new Error(res?.message || '后端试算失败');
      }
      return res.data;
    },
    onSuccess: (data) => {
      const serverItems = data?.items ?? [];
      const rows = pricedLines.map((line, index) => {
        const server = serverItems[index];
        const serverUnitPrice = server?.unitPrice;
        const serverAmount = server?.amount;
        const same =
          serverUnitPrice !== undefined &&
          serverAmount !== undefined &&
          Math.abs(line.unitPrice - serverUnitPrice) < EPSILON &&
          Math.abs(line.amount - serverAmount) < EPSILON;
        return {
          index: index + 1,
          localUnitPrice: line.unitPrice,
          serverUnitPrice,
          localAmount: line.amount,
          serverAmount,
          same,
        };
      });
      const totalSame =
        Math.abs(summary.totalAmount - (data?.totalAmount ?? 0)) < EPSILON &&
        Math.abs(summary.totalCost - (data?.totalCost ?? 0)) < EPSILON &&
        Math.abs(summary.profitAmount - (data?.profitAmount ?? 0)) < EPSILON &&
        Math.abs(summary.profitRate - (data?.profitRate ?? 0)) < EPSILON;
      setCompared({
        rows,
        serverTotalAmount: data?.totalAmount,
        serverTotalCost: data?.totalCost,
        serverProfitAmount: data?.profitAmount,
        serverProfitRate: data?.profitRate,
        totalSame,
      });
      setCompareError(undefined);
      messageApi.success('后端试算完成');
    },
    onError: (error) => {
      setCompared(undefined);
      setCompareError(error.message);
      messageApi.error(error.message);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const values = form.getFieldsValue();
      if (!values.customerId) {
        throw new Error('保存报价单需要先选择客户');
      }
      if (!values.items?.length) {
        throw new Error('至少需要一条报价明细');
      }
      const res = await createQuotation(buildRequest());
      if (res?.code !== 200) {
        throw new Error(res?.message || '保存失败');
      }
      return res.data;
    },
    onSuccess: (data) => {
      messageApi.success(`报价单 ${data?.quotationNo ?? ''} 保存成功`);
      history.push('/crm/quotation-manage');
    },
    onError: (error) => {
      messageApi.error(error.message);
    },
  });

  return (
    <PageContainer
      title="报价计算"
      subTitle="按 后端 QuotationPricingServiceImpl 的同一套算法展示逐步计算过程"
    >
      {contextHolder}
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          currencyCode: 'USD',
          markupRate: 0,
          discountRate: 0,
          incoterm: 'FOB',
          items: [{ rowKey: 'row-0', quantity: 1 }],
        }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={9}>
            <Card variant="borderless" title="买家国家 · 当地行情">
              <Select
                showSearch
                allowClear
                value={countryCode}
                placeholder="输入国家码 / 英文名 / 中文名 / 别名搜索"
                filterOption={false}
                loading={countryLoading}
                onSearch={setCountryKeyword}
                onChange={(value) =>
                  setCountryCode(value as string | undefined)
                }
                options={countrySelectOptions}
                style={{ width: '100%' }}
              />
              {countryInfo ? (
                <Descriptions
                  size="small"
                  column={1}
                  bordered
                  style={{ marginTop: 12 }}
                  items={countryInfoItems}
                />
              ) : (
                <Alert
                  type="info"
                  showIcon
                  style={{ marginTop: 12 }}
                  message="选择国家后，这里展示当地时区、当前时间、主要货币以及对美元 / 人民币的汇率"
                />
              )}
            </Card>

            <Card
              variant="borderless"
              title="报价参数"
              style={{ marginTop: 16 }}
            >
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="currencyCode"
                    label="报价币种"
                    tooltip="必须与所选产品的成本币种一致，否则后端拒绝试算"
                  >
                    <Select
                      options={CURRENCIES.map((code) => ({
                        label: code,
                        value: code,
                      }))}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="incoterm" label="贸易术语">
                    <Select options={INCOTERMS} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="markupRate"
                    label="单头加价率 %"
                    tooltip="行加价率留空时继承该值"
                  >
                    <InputNumber
                      min={0}
                      max={1000}
                      precision={2}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="discountRate"
                    label="单头折扣率 %"
                    tooltip="行折扣率留空时继承该值"
                  >
                    <InputNumber
                      min={0}
                      max={100}
                      precision={2}
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="customerId" label="客户">
                    <Select
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      placeholder="保存报价单时必填"
                      options={customerOptions}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="validUntil" label="有效期">
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Card
              variant="borderless"
              title="报价明细"
              style={{ marginTop: 16 }}
              extra={
                <Button
                  type="dashed"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() =>
                    form.setFieldValue('items', [
                      ...(form.getFieldValue('items') ?? []),
                      { rowKey: nextRowKey(), quantity: 1 },
                    ])
                  }
                >
                  添加明细
                </Button>
              }
            >
              <Form.List name="items">
                {(fields, { remove }) => (
                  <>
                    {fields.map((field, index) => {
                      const priced = pricedLines[index];
                      return (
                        <Card
                          key={field.key}
                          size="small"
                          style={{ marginBottom: 12 }}
                          title={`第 ${index + 1} 行`}
                          extra={
                            <ActionButton
                              title="删除该行"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => remove(field.name)}
                            />
                          }
                        >
                          <Form.Item
                            {...field}
                            name={[field.name, 'productId']}
                            label="产品"
                            rules={[{ required: true, message: '请选择产品' }]}
                          >
                            <Select
                              showSearch
                              optionFilterProp="label"
                              placeholder="选择产品"
                              options={productOptions.map((option) => ({
                                label: `${option.label}${
                                  option.product?.costPrice !== undefined
                                    ? `（成本 ${option.product.costPrice} ${
                                        option.product.costCurrency ?? ''
                                      }）`
                                    : ''
                                }`,
                                value: option.value,
                              }))}
                            />
                          </Form.Item>
                          <Row gutter={8}>
                            <Col span={8}>
                              <Form.Item
                                {...field}
                                name={[field.name, 'quantity']}
                                label="数量"
                              >
                                <InputNumber
                                  min={0}
                                  style={{ width: '100%' }}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={8}>
                              <Form.Item
                                {...field}
                                name={[field.name, 'markupRate']}
                                label="行加价率 %"
                                tooltip="留空继承单头"
                              >
                                <InputNumber
                                  min={0}
                                  max={1000}
                                  precision={2}
                                  style={{ width: '100%' }}
                                />
                              </Form.Item>
                            </Col>
                            <Col span={8}>
                              <Form.Item
                                {...field}
                                name={[field.name, 'discountRate']}
                                label="行折扣率 %"
                                tooltip="留空继承单头"
                              >
                                <InputNumber
                                  min={0}
                                  max={100}
                                  precision={2}
                                  style={{ width: '100%' }}
                                />
                              </Form.Item>
                            </Col>
                          </Row>
                          <Space size={16} align="center">
                            <Form.Item
                              {...field}
                              name={[field.name, 'manualPrice']}
                              label="手工改价"
                              valuePropName="checked"
                            >
                              <Switch size="small" />
                            </Form.Item>
                            <Form.Item
                              {...field}
                              name={[field.name, 'manualUnitPrice']}
                              label="手工单价"
                            >
                              <InputNumber
                                min={0}
                                precision={6}
                                disabled={!watchedItems?.[index]?.manualPrice}
                                style={{ width: 160 }}
                              />
                            </Form.Item>
                          </Space>
                          {priced?.errors?.length ? (
                            <Alert
                              type="error"
                              showIcon
                              style={{ marginTop: 8 }}
                              message={priced.errors.join('；')}
                            />
                          ) : (
                            <div style={{ marginTop: 8, color: '#666' }}>
                              单价 <b>{unit(priced?.unitPrice)}</b> {currency}{' '}
                              ， 金额 <b>{money(priced?.amount)}</b> {currency}
                            </div>
                          )}
                        </Card>
                      );
                    })}
                    {fields.length === 0 ? (
                      <Alert
                        type="info"
                        showIcon
                        message="还没有报价明细，点击右上角「添加明细」开始算价"
                      />
                    ) : null}
                  </>
                )}
              </Form.List>
            </Card>
          </Col>

          <Col xs={24} xl={15}>
            <Card
              variant="borderless"
              title="计算过程"
              extra={
                <Space>
                  <Tag color="blue">单价精度 6 位</Tag>
                  <Tag color="blue">金额精度 2 位</Tag>
                </Space>
              }
            >
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Statistic
                    title="报价总额 = Σ 行金额"
                    value={summary.totalAmount}
                    precision={2}
                    suffix={currency}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="成本汇总 = Σ (成本价 × 数量)"
                    value={summary.totalCost}
                    precision={2}
                    suffix={currency}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="毛利额 = 总额 − 成本"
                    value={summary.profitAmount}
                    precision={2}
                    suffix={currency}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title="毛利率 = 毛利额 ÷ 总额"
                    value={summary.profitRate}
                    precision={2}
                    suffix="%"
                  />
                </Col>
              </Row>

              <Divider style={{ margin: '16px 0' }} />

              {pricedLines.length === 0 ? (
                <Alert
                  type="info"
                  showIcon
                  message="填写明细后，这里会展示每一步的算式（成本 → 加价 → 折扣 → 单价 → 金额）"
                />
              ) : (
                pricedLines.map((line, index) => (
                  <Card
                    key={line.rowKey ?? line.productId ?? `row-${index}`}
                    size="small"
                    style={{ marginBottom: 12 }}
                    title={
                      <Space size={8}>
                        <span>第 {index + 1} 行</span>
                        <span style={{ color: '#999', fontWeight: 400 }}>
                          {line.productCode ?? ''} {line.productName ?? ''}
                        </span>
                        {line.manualPrice ? <Tag>手工改价</Tag> : null}
                        {line.errors.length ? (
                          <Tag color="error">校验不通过</Tag>
                        ) : null}
                      </Space>
                    }
                  >
                    {line.steps.map((step) => (
                      <div
                        key={step.step}
                        style={{
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: 12,
                          padding: '6px 0',
                          borderBottom: '1px dashed #f0f0f0',
                        }}
                      >
                        <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                          {step.step}
                        </Tag>
                        <span style={{ width: 72 }}>{step.title}</span>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            color: '#888',
                            minWidth: 180,
                          }}
                        >
                          {step.formula ?? ''}
                        </span>
                        <span
                          style={{
                            marginInlineStart: 'auto',
                            fontWeight: 600,
                            fontFamily: 'monospace',
                          }}
                        >
                          {step.value.toFixed(step.scale ?? 2)} {currency}
                        </span>
                        <Tooltip title={step.note}>
                          <span style={{ color: '#999', fontSize: 12 }}>
                            {step.note}
                          </span>
                        </Tooltip>
                      </div>
                    ))}
                    {line.errors.length ? (
                      <Alert
                        type="error"
                        showIcon
                        style={{ marginTop: 8 }}
                        message={line.errors.join('；')}
                      />
                    ) : null}
                  </Card>
                ))
              )}
            </Card>

            <Card
              variant="borderless"
              title="后端试算校验"
              style={{ marginTop: 16 }}
              extra={
                <Space>
                  <Button
                    type="primary"
                    icon={<ThunderboltOutlined />}
                    loading={compareMutation.isPending}
                    disabled={!pricedLines.length}
                    onClick={() => compareMutation.mutate()}
                  >
                    调用后端试算并对照
                  </Button>
                  <Button
                    icon={<CalculatorOutlined />}
                    loading={saveMutation.isPending}
                    disabled={hasError || !pricedLines.length}
                    onClick={() => saveMutation.mutate()}
                  >
                    保存为报价单
                  </Button>
                </Space>
              }
            >
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 12 }}
                message="左边的算式是前端按同一套规则镜像算出来的；点「调用后端试算并对照」会用 POST /api/crm/quotations/calculate 复核，两边结果不一致时以红标提示。"
              />
              {compareError ? (
                <Alert
                  type="error"
                  showIcon
                  style={{ marginBottom: 12 }}
                  message="后端试算未通过"
                  description={compareError}
                />
              ) : null}
              {compared ? (
                <>
                  <Table
                    size="small"
                    rowKey="index"
                    pagination={false}
                    dataSource={compared.rows}
                    columns={compareColumns}
                    scroll={{ x: 'max-content' }}
                  />
                  <Descriptions
                    style={{ marginTop: 16 }}
                    size="small"
                    column={2}
                    bordered
                    title="汇总对照"
                    items={[
                      {
                        key: 'amount',
                        label: '报价总额',
                        children: (
                          <Space>
                            <span>本地 {money(summary.totalAmount)}</span>
                            <span>
                              后端 {money(compared.serverTotalAmount)}
                            </span>
                            {Math.abs(
                              summary.totalAmount -
                                (compared.serverTotalAmount ?? 0),
                            ) < EPSILON ? (
                              <Tag color="success">一致</Tag>
                            ) : (
                              <Tag color="error">不一致</Tag>
                            )}
                          </Space>
                        ),
                      },
                      {
                        key: 'cost',
                        label: '成本汇总',
                        children: (
                          <Space>
                            <span>本地 {money(summary.totalCost)}</span>
                            <span>后端 {money(compared.serverTotalCost)}</span>
                          </Space>
                        ),
                      },
                      {
                        key: 'profit',
                        label: '毛利额',
                        children: (
                          <Space>
                            <span>本地 {money(summary.profitAmount)}</span>
                            <span>
                              后端 {money(compared.serverProfitAmount)}
                            </span>
                          </Space>
                        ),
                      },
                      {
                        key: 'rate',
                        label: '毛利率 %',
                        children: (
                          <Space>
                            <span>本地 {summary.profitRate}</span>
                            <span>后端 {compared.serverProfitRate}</span>
                            {compared.totalSame ? (
                              <Tag color="success">一致</Tag>
                            ) : (
                              <Tag color="error">不一致</Tag>
                            )}
                          </Space>
                        ),
                      },
                    ]}
                  />
                </>
              ) : (
                <div style={{ color: '#999' }}>尚未调用后端试算</div>
              )}
            </Card>

            <Card
              variant="borderless"
              title="算价规则说明"
              style={{ marginTop: 16 }}
            >
              <ul style={{ margin: 0, paddingInlineStart: 20, color: '#666' }}>
                <li>
                  行单价 = 成本价 × (1 + 加价率 ÷ 100) × (1 − 折扣率 ÷ 100)，
                  四舍五入保留 6 位小数
                </li>
                <li>行金额 = 行单价 × 数量，四舍五入保留 2 位小数</li>
                <li>
                  成本汇总 = Σ (成本价 × 数量)；报价总额 = Σ 行金额；毛利额 =
                  总额 − 成本
                </li>
                <li>毛利率 = 毛利额 ÷ 报价总额 × 100%，保留 2 位小数</li>
                <li>手工改价的行直接取手工单价，不参与加价率与折扣率计算</li>
                <li>
                  校验规则：产品须在售、须维护成本价、成本币种须与报价币种一致、
                  数量须大于 0 且不低于 MOQ
                </li>
              </ul>
            </Card>
          </Col>
        </Row>
      </Form>
    </PageContainer>
  );
};

export default QuotationCalculator;
