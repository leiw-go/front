import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import {
  ActionType,
  PageContainer,
  ProColumns,
  ProForm,
  ProFormDatePicker,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
  type ProFormInstance,
} from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  App,
  Button,
  Drawer,
  Modal,
  Popconfirm,
  Space,
  Statistic,
  Table,
  Tabs,
  Tag,
} from 'antd';
import React, { useRef, useState } from 'react';
import {
  createStrategy,
  deleteStrategy,
  getStrategy,
  getStrategyAccountInfo,
  getStrategyOrders,
  getStrategyPositions,
  getStrategyTrades,
  listAccounts,
  pageStrategies,
  refreshStrategy,
  runStrategy,
  stopStrategy,
  updateStrategy,
} from './service';
import type { QuantStrategyItem } from './data.d';

const statusEnum = {
  DRAFT: { text: '草稿', status: 'Default' },
  RUNNING: { text: '运行中', status: 'Processing' },
  STOPPED: { text: '已停止', status: 'Default' },
  ERROR: { text: '错误', status: 'Error' },
  COMPLETED: { text: '已完成', status: 'Success' },
} as const;

const typeEnum = {
  BACKTEST: { text: '回测', color: 'blue' },
  SIM: { text: '模拟', color: 'purple' },
  LIVE: { text: '实盘', color: 'red' },
} as const;

const frequencyOptions = [
  { label: '每日 (day)', value: 'day' },
  { label: '分钟 (minute)', value: 'minute' },
  { label: '5 分钟', value: '5m' },
  { label: '15 分钟', value: '15m' },
  { label: '30 分钟', value: '30m' },
  { label: '60 分钟', value: '60m' },
];

const benchmarkOptions = [
  { label: '沪深 300', value: '000300.XSHG' },
  { label: '中证 500', value: '000905.XSHG' },
  { label: '上证 50', value: '000016.XSHG' },
  { label: '创业板指', value: '399006.XSHE' },
  { label: '科创 50', value: '000688.XSHG' },
];

const StrategyManage: React.FC = () => {
  const { message } = App.useApp();
  const actionRef = useRef<ActionType | null>(null);
  const queryClient = useQueryClient();
  const [form] = ProForm.useForm<QuantStrategyItem>();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<QuantStrategyItem | undefined>();
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTab, setDetailTab] = useState<'overview' | 'positions' | 'orders' | 'trades'>(
    'overview',
  );

  // accounts for select
  const { data: accountData } = useQuery({
    queryKey: ['quant-accounts'],
    queryFn: () => listAccounts().then((r) => r.data),
  });
  const accountOptions = (accountData ?? []).map((a) => ({
    label: `${a.accountName} (${a.username})`,
    value: a.id!,
  }));

  const { mutateAsync: addRun, isPending: addLoading } = useMutation({
    mutationFn: (values: QuantStrategyItem) => createStrategy(values),
    onSuccess: () => {
      message.success('策略创建成功');
      actionRef.current?.reload();
      setCreateOpen(false);
    },
    onError: () => message.error('策略创建失败'),
  });

  const { mutateAsync: updateRun, isPending: updateLoading } = useMutation({
    mutationFn: (params: { id: string; body: QuantStrategyItem }) =>
      updateStrategy(params.id, params.body),
    onSuccess: () => {
      message.success('策略更新成功');
      actionRef.current?.reload();
      setEditOpen(false);
      setCurrentRow(undefined);
    },
    onError: () => message.error('策略更新失败'),
  });

  const { mutateAsync: delRun } = useMutation({
    mutationFn: (id: string) => deleteStrategy(id),
    onSuccess: () => {
      message.success('策略已删除');
      actionRef.current?.reload();
    },
    onError: () => message.error('策略删除失败'),
  });

  const { mutateAsync: runRun } = useMutation({
    mutationFn: (id: string) => runStrategy(id),
    onSuccess: () => {
      message.success('策略已提交运行');
      actionRef.current?.reload();
    },
    onError: (e: any) =>
      message.error(`策略运行失败: ${e?.response?.data?.message || e.message}`),
  });

  const { mutateAsync: stopRun } = useMutation({
    mutationFn: (id: string) => stopStrategy(id),
    onSuccess: () => {
      message.success('策略已停止');
      actionRef.current?.reload();
    },
    onError: (e: any) => message.error(`停止失败: ${e?.response?.data?.message || e.message}`),
  });

  const { mutateAsync: refreshRun } = useMutation({
    mutationFn: (id: string) => refreshStrategy(id),
    onSuccess: () => {
      message.success('状态已刷新');
      actionRef.current?.reload();
      queryClient.invalidateQueries({ queryKey: ['strategy-detail'] });
    },
    onError: () => message.error('状态刷新失败'),
  });

  const columns: ProColumns<QuantStrategyItem>[] = [
    {
      title: '策略名称',
      dataIndex: 'name',
      render: (dom, entity) => (
        <a
          onClick={async () => {
            setCurrentRow(entity);
            setDetailOpen(true);
            setDetailTab('overview');
            queryClient.invalidateQueries({ queryKey: ['strategy-detail', entity.id] });
          }}
        >
          {dom as string}
        </a>
      ),
    },
    {
      title: '所属账户',
      dataIndex: 'accountName',
      render: (_, r) => r.accountName || r.accountId,
    },
    {
      title: '类型',
      dataIndex: 'strategyType',
      valueType: 'select',
      valueEnum: typeEnum,
      render: (_, r) => {
        const meta = typeEnum[r.strategyType as keyof typeof typeEnum];
        return meta ? <Tag color={meta.color}>{meta.text}</Tag> : '-';
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: statusEnum,
    },
    {
      title: '初始资金',
      dataIndex: 'initialCapital',
      valueType: 'digit',
      hideInSearch: true,
      render: (v) => (v != null ? `¥ ${Number(v).toLocaleString()}` : '-'),
    },
    {
      title: '频率',
      dataIndex: 'frequency',
      hideInSearch: true,
    },
    {
      title: '最近运行',
      dataIndex: 'lastRunTime',
      valueType: 'dateTime',
      hideInSearch: true,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      valueType: 'dateTime',
      hideInSearch: true,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 280,
      render: (_, record) => [
        <a
          key="run"
          onClick={() => runRun(record.id!)}
          disabled={record.status === 'RUNNING'}
        >
          <PlayCircleOutlined /> 启动
        </a>,
        <a
          key="stop"
          onClick={() => stopRun(record.id!)}
          disabled={record.status !== 'RUNNING'}
        >
          <PauseCircleOutlined /> 停止
        </a>,
        <a
          key="refresh"
          onClick={() => refreshRun(record.id!)}
        >
          <ReloadOutlined /> 刷新
        </a>,
        <a
          key="edit"
          onClick={async () => {
            const detail = await getStrategy(record.id!).then((r) => r.data);
            setCurrentRow(detail);
            setEditOpen(true);
            form.setFieldsValue(detail);
          }}
        >
          <EditOutlined /> 编辑
        </a>,
        <Popconfirm
          key="delete"
          title="确定删除该策略?"
          onConfirm={() => delRun(record.id!)}
        >
          <a style={{ color: 'red' }}>
            <DeleteOutlined /> 删除
          </a>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer
      header={{
        title: '量化策略管理',
        subTitle: '基于聚宽 (JoinQuant) SDK 的策略运行、监控与回测',
      }}
    >
      <ProTable<QuantStrategyItem>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={{
          labelWidth: 'auto',
        }}
        pagination={{ pageSize: 10 }}
        request={async (params) => {
          const res = await pageStrategies({
            current: params.current,
            pageSize: params.pageSize,
            name: params.name,
            accountId: params.accountId,
            status: params.status,
            strategyType: params.strategyType,
          });
          return {
            data: res.data?.records || [],
            total: res.data?.total || 0,
            success: res.code === 200,
          };
        }}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              form.resetFields();
              setCurrentRow(undefined);
              setCreateOpen(true);
            }}
          >
            新建策略
          </Button>,
        ]}
      />

      {/* Create Modal */}
      <Modal
        title="新建策略"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={addLoading}
        width={760}
        destroyOnClose
      >
        <StrategyForm
          form={form}
          accountOptions={accountOptions}
          onFinish={async (values) => {
            await addRun({
              ...values,
              strategyType: values.strategyType || 'BACKTEST',
              frequency: values.frequency || 'day',
              benchmark: values.benchmark || '000300.XSHG',
              initialCapital: values.initialCapital || 100000,
            });
          }}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="编辑策略"
        open={editOpen}
        onCancel={() => setEditOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={updateLoading}
        width={760}
        destroyOnClose
      >
        <StrategyForm
          form={form}
          accountOptions={accountOptions}
          initialValues={currentRow}
          onFinish={async (values) => {
            await updateRun({
              id: currentRow!.id!,
              body: values,
            });
          }}
        />
      </Modal>

      {/* Detail Drawer */}
      <Drawer
        title={currentRow ? `${currentRow.name} - 详情` : '策略详情'}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={920}
        destroyOnClose
      >
        {currentRow && (
          <StrategyDetail
            strategy={currentRow}
            initialTab={detailTab}
            onRefresh={() => refreshRun(currentRow.id!)}
          />
        )}
      </Drawer>
    </PageContainer>
  );
};

export default StrategyManage;

/* ---------- Inline sub-components ---------- */

const StrategyForm: React.FC<{
  form: ProFormInstance;
  accountOptions: { label: string; value: string }[];
  initialValues?: QuantStrategyItem;
  onFinish: (values: QuantStrategyItem) => Promise<void>;
}> = ({ form, accountOptions, initialValues, onFinish }) => (
  <ProForm<QuantStrategyItem>
    form={form}
    initialValues={initialValues}
    layout="vertical"
    onFinish={async (values) => {
      await onFinish(values);
    }}
  >
    <ProFormText
      name="name"
      label="策略名称"
      rules={[{ required: true, message: '请输入策略名称' }]}
    />
    <ProFormSelect
      name="accountId"
      label="所属账户"
      options={accountOptions}
      rules={[{ required: true, message: '请选择聚宽账户' }]}
    />
    <ProFormTextArea name="description" label="策略描述" fieldProps={{ rows: 2 }} />
    <ProFormSelect
      name="strategyType"
      label="策略类型"
      options={[
        { label: '回测 (BACKTEST)', value: 'BACKTEST' },
        { label: '模拟 (SIM)', value: 'SIM' },
        { label: '实盘 (LIVE)', value: 'LIVE' },
      ]}
    />
    <ProFormDigit name="initialCapital" label="初始资金 (元)" min={0} />
    <ProFormSelect name="benchmark" label="基准指数" options={benchmarkOptions} />
    <ProFormDatePicker name="startDate" label="开始日期" />
    <ProFormDatePicker name="endDate" label="结束日期" />
    <ProFormSelect name="frequency" label="运行频率" options={frequencyOptions} />
    <ProFormTextArea
      name="parameters"
      label="策略参数 (JSON)"
      fieldProps={{
        rows: 3,
        placeholder: '{"shortWindow": 5, "longWindow": 20}',
      }}
    />
    <ProFormTextArea
      name="code"
      label="策略代码 (Python)"
      fieldProps={{
        rows: 12,
        placeholder:
          'def initialize(context):\n    run_daily(market_open, time="open")\n\ndef market_open(context):\n    pass',
      }}
    />
  </ProForm>
);

const StrategyDetail: React.FC<{
  strategy: QuantStrategyItem;
  initialTab: 'overview' | 'positions' | 'orders' | 'trades';
  onRefresh: () => void;
}> = ({ strategy, initialTab, onRefresh }) => {
  const { data: account } = useQuery({
    queryKey: ['strategy-detail-account', strategy.id],
    queryFn: () => getStrategyAccountInfo(strategy.id!).then((r) => r.data),
  });
  const { data: positions } = useQuery({
    queryKey: ['strategy-detail-positions', strategy.id],
    queryFn: () => getStrategyPositions(strategy.id!).then((r) => r.data || []),
  });
  const { data: orders } = useQuery({
    queryKey: ['strategy-detail-orders', strategy.id],
    queryFn: () => getStrategyOrders(strategy.id!).then((r) => r.data || []),
  });
  const { data: trades } = useQuery({
    queryKey: ['strategy-detail-trades', strategy.id],
    queryFn: () => getStrategyTrades(strategy.id!).then((r) => r.data || []),
  });

  return (
    <Tabs
      defaultActiveKey={initialTab}
      tabBarExtraContent={
        <Button icon={<ReloadOutlined />} onClick={onRefresh}>
          刷新状态
        </Button>
      }
      items={[
        {
          key: 'overview',
          label: '概览',
          children: (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Space size="large" wrap>
                <Statistic
                  title="账户余额"
                  value={account?.cash ?? 0}
                  precision={2}
                  prefix="¥"
                />
                <Statistic
                  title="持仓市值"
                  value={account?.positionsValue ?? 0}
                  precision={2}
                  prefix="¥"
                />
                <Statistic
                  title="总资产"
                  value={account?.totalValue ?? 0}
                  precision={2}
                  prefix="¥"
                />
              </Space>
              <div>
                <strong>状态: </strong>
                <Tag>{strategy.status}</Tag>
                <Tag color="blue">{strategy.strategyType}</Tag>
              </div>
              <div>
                <strong>基准: </strong>
                {strategy.benchmark} · <strong>频率: </strong>
                {strategy.frequency}
              </div>
              <div>
                <strong>回测 ID: </strong>
                {strategy.jqBacktestId || '未运行'}
              </div>
              {strategy.lastError && (
                <div style={{ color: 'red' }}>
                  <strong>最近错误: </strong>
                  {strategy.lastError}
                </div>
              )}
              <div>
                <strong>策略代码</strong>
                <pre
                  style={{
                    background: '#f5f5f5',
                    padding: 12,
                    borderRadius: 4,
                    maxHeight: 360,
                    overflow: 'auto',
                  }}
                >
                  {strategy.code || '(无)'}
                </pre>
              </div>
            </Space>
          ),
        },
        {
          key: 'positions',
          label: `持仓 (${positions?.length || 0})`,
          children: (
            <Table
              size="small"
              rowKey={(r: any) => `${r.security}-${r.side}`}
              dataSource={positions || []}
              pagination={false}
              columns={[
                { title: '标的', dataIndex: 'security' },
                { title: '方向', dataIndex: 'side' },
                { title: '数量', dataIndex: 'volume' },
                {
                  title: '成本价',
                  dataIndex: 'avgCost',
                  render: (v) => Number(v).toFixed(2),
                },
                {
                  title: '现价',
                  dataIndex: 'price',
                  render: (v) => Number(v).toFixed(2),
                },
                {
                  title: '市值',
                  dataIndex: 'value',
                  render: (v) => Number(v).toFixed(2),
                },
              ]}
            />
          ),
        },
        {
          key: 'orders',
          label: `订单 (${orders?.length || 0})`,
          children: (
            <Table
              size="small"
              rowKey="orderId"
              dataSource={orders || []}
              pagination={{ pageSize: 20 }}
              columns={[
                { title: '订单号', dataIndex: 'orderId' },
                { title: '标的', dataIndex: 'security' },
                { title: '方向', dataIndex: 'side' },
                { title: '数量', dataIndex: 'amount' },
                {
                  title: '价格',
                  dataIndex: 'price',
                  render: (v) => Number(v).toFixed(2),
                },
                { title: '状态', dataIndex: 'status' },
                { title: '已成交', dataIndex: 'filled' },
              ]}
            />
          ),
        },
        {
          key: 'trades',
          label: `成交 (${trades?.length || 0})`,
          children: (
            <Table
              size="small"
              rowKey="tradeId"
              dataSource={trades || []}
              pagination={{ pageSize: 20 }}
              columns={[
                { title: '成交号', dataIndex: 'tradeId' },
                { title: '订单号', dataIndex: 'orderId' },
                { title: '标的', dataIndex: 'security' },
                { title: '方向', dataIndex: 'side' },
                { title: '数量', dataIndex: 'amount' },
                {
                  title: '价格',
                  dataIndex: 'price',
                  render: (v) => Number(v).toFixed(2),
                },
                { title: '时间', dataIndex: 'time' },
              ]}
            />
          ),
        },
      ]}
    />
  );
};
