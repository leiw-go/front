import {
  ArrowRightOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDatePicker,
  ProFormDependency,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Descriptions,
  Drawer,
  message,
  Popconfirm,
  Progress,
  Space,
  Table,
  Tag,
} from 'antd';
import { useRef, useState } from 'react';
import ActionButton from '@/components/ActionButton';
import {
  changeStage,
  createOpportunity,
  deleteOpportunity,
  getOpportunity,
  listOpportunities,
  opportunityPipeline,
  updateOpportunity,
} from '@/services/crm/crmOpportunity';
import { useCustomerOptions, useOwnerOptions } from '../hooks/useOptions';
import {
  CURRENCIES,
  formatAmount,
  OPPORTUNITY_STAGES,
  toTableResult,
} from '../shared';

const STAGE_FLOW = [
  'INITIAL_CONTACT',
  'QUALIFIED',
  'QUOTED',
  'NEGOTIATION',
  'WON',
];

const stageText = (stage?: string) =>
  OPPORTUNITY_STAGES.find((item) => item.value === stage)?.label ??
  stage ??
  '-';

/** 当前阶段允许推进到的目标阶段：顺序推进一格，或直接置丢单 */
function nextStages(current?: string) {
  if (!current) return ['INITIAL_CONTACT', 'LOST'];
  const index = STAGE_FLOW.indexOf(current);
  const options: string[] = [];
  if (index >= 0 && index < STAGE_FLOW.length - 1) {
    options.push(STAGE_FLOW[index + 1]);
  }
  if (current !== 'WON' && current !== 'LOST') {
    options.push('LOST');
  }
  return options;
}

const OpportunityManage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const { options: ownerOptions, nameOf: ownerName } = useOwnerOptions();
  const { options: customerOptions, nameOf: customerName } =
    useCustomerOptions();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [stageOpen, setStageOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [pipelineOpen, setPipelineOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<Crm.CrmOpportunityDto>();
  const [detail, setDetail] = useState<Crm.CrmOpportunityDto>();
  const [pipeline, setPipeline] = useState<Crm.CrmOpportunityPipelineDto>();

  const createMutation = useMutation({
    mutationFn: (values: Crm.CrmOpportunityRequest) =>
      createOpportunity(values),
    onSuccess: () => {
      messageApi.success('商机创建成功');
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      actionRef.current?.reload();
      setCreateOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: Crm.CrmOpportunityRequest) =>
      updateOpportunity({ id: currentRow?.id as string }, values),
    onSuccess: () => {
      messageApi.success('商机更新成功');
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      actionRef.current?.reload();
      setEditOpen(false);
      setCurrentRow(undefined);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteOpportunity({ id }),
    onSuccess: () => {
      messageApi.success('商机删除成功');
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      actionRef.current?.reload();
    },
  });

  const stageMutation = useMutation({
    mutationFn: (values: Crm.CrmOpportunityStageRequest) =>
      changeStage({ id: currentRow?.id as string }, values),
    onSuccess: () => {
      messageApi.success('商机阶段已推进');
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      actionRef.current?.reload();
      setStageOpen(false);
      setCurrentRow(undefined);
    },
  });

  const openDetail = async (id: string) => {
    const res = await getOpportunity({ id });
    setDetail(res?.data);
    setDetailOpen(true);
  };

  const openPipeline = async () => {
    const res = await opportunityPipeline();
    setPipeline(res?.data);
    setPipelineOpen(true);
  };

  const columns: ProColumns<Crm.CrmOpportunityDto>[] = [
    {
      title: '商机名称',
      dataIndex: 'name',
      width: 200,
      render: (_, record) => (
        <a
          onClick={() => record.id && openDetail(record.id)}
          style={{ marginRight: 8 }}
        >
          {record.name}
        </a>
      ),
    },
    {
      title: '客户',
      dataIndex: 'customerId',
      width: 160,
      render: (_, record) => customerName(record.customerId),
    },
    {
      title: '阶段',
      dataIndex: 'stage',
      width: 110,
      valueType: 'select',
      valueEnum: Object.fromEntries(
        OPPORTUNITY_STAGES.map((item) => [
          item.value,
          { text: item.label, status: 'Default' },
        ]),
      ),
      render: (_, record) => <Tag color="blue">{stageText(record.stage)}</Tag>,
    },
    {
      title: '预计金额',
      dataIndex: 'amount',
      width: 150,
      search: false,
      render: (_, record) =>
        `${formatAmount(record.amount)} ${record.currencyCode ?? ''}`,
    },
    {
      title: '赢率',
      dataIndex: 'winRate',
      width: 80,
      search: false,
      render: (_, record) =>
        record.winRate === undefined ? '-' : `${record.winRate}%`,
    },
    {
      title: '预计成交日',
      dataIndex: 'expectCloseDate',
      width: 120,
      search: false,
    },
    {
      title: '负责人',
      dataIndex: 'ownerId',
      width: 110,
      search: false,
      render: (_, record) => ownerName(record.ownerId),
    },
    {
      title: '操作',
      dataIndex: 'option',
      width: 110,
      fixed: 'right',
      search: false,
      render: (_, record) => (
        <Space size={4}>
          <ActionButton
            key="stage"
            title="推进阶段"
            icon={<ArrowRightOutlined />}
            onClick={() => {
              setCurrentRow(record);
              setStageOpen(true);
            }}
          />
          <ActionButton
            key="edit"
            title="编辑"
            icon={<EditOutlined />}
            onClick={() => {
              setCurrentRow(record);
              setEditOpen(true);
            }}
          />
          <Popconfirm
            key="delete"
            title="确认删除该商机？"
            onConfirm={() => record.id && deleteMutation.mutateAsync(record.id)}
          >
            <ActionButton title="删除" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const opportunityFormItems = (
    <>
      <ProFormSelect
        name="customerId"
        label="客户"
        width="md"
        options={customerOptions}
        rules={[{ required: true, message: '请选择客户' }]}
      />
      <ProFormText
        name="name"
        label="商机名称"
        width="md"
        rules={[{ required: true, message: '请输入商机名称' }]}
      />
      <ProFormSelect
        name="stage"
        label="阶段"
        width="sm"
        options={OPPORTUNITY_STAGES}
        initialValue="INITIAL_CONTACT"
      />
      <ProFormSelect
        name="ownerId"
        label="负责人"
        width="sm"
        options={ownerOptions}
        rules={[{ required: true, message: '请选择负责人' }]}
      />
      <ProFormDigit
        name="amount"
        label="预计金额"
        width="sm"
        fieldProps={{ min: 0, precision: 2 }}
      />
      <ProFormSelect
        name="currencyCode"
        label="币种"
        width="sm"
        options={CURRENCIES.map((code) => ({ label: code, value: code }))}
        initialValue="USD"
      />
      <ProFormDigit
        name="winRate"
        label="赢率 %"
        width="sm"
        fieldProps={{ min: 0, max: 100 }}
      />
      <ProFormDatePicker name="expectCloseDate" label="预计成交日" width="sm" />
      <ProFormText name="competitor" label="竞争对手" width="md" />
      <ProFormTextArea
        name="lostReason"
        label="丢单原因"
        width="md"
        fieldProps={{ rows: 2 }}
        tooltip="阶段置为「丢单」时必填"
      />
      <ProFormTextArea
        name="remark"
        label="备注"
        width="md"
        fieldProps={{ rows: 2 }}
      />
    </>
  );

  return (
    <PageContainer>
      {contextHolder}
      <ProTable<Crm.CrmOpportunityDto>
        headerTitle="商机列表"
        actionRef={actionRef}
        rowKey="id"
        scroll={{ x: 'max-content' }}
        search={{ labelWidth: 'auto' }}
        toolBarRender={() => [
          <Button key="pipeline" onClick={openPipeline}>
            销售漏斗
          </Button>,
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateOpen(true)}
          >
            新增商机
          </Button>,
        ]}
        request={async (params) => {
          const { current = 1, pageSize = 10, ...rest } = params;
          const res = await listOpportunities({
            page: current,
            size: pageSize,
            name: rest.name as string | undefined,
            stage: rest.stage as string | undefined,
            customerId: rest.customerId as string | undefined,
          });
          return toTableResult<Crm.CrmOpportunityDto>(res);
        }}
        columns={columns}
      />

      <ModalForm
        title="新增商机"
        open={createOpen}
        onOpenChange={setCreateOpen}
        width={760}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          try {
            await createMutation.mutateAsync(
              values as Crm.CrmOpportunityRequest,
            );
            return true;
          } catch {
            return false;
          }
        }}
      >
        {opportunityFormItems}
      </ModalForm>

      <ModalForm
        key={currentRow?.id ?? 'opportunity-edit'}
        title="编辑商机"
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setCurrentRow(undefined);
        }}
        initialValues={currentRow}
        width={760}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          try {
            await updateMutation.mutateAsync(
              values as Crm.CrmOpportunityRequest,
            );
            return true;
          } catch {
            return false;
          }
        }}
      >
        {opportunityFormItems}
      </ModalForm>

      <ModalForm
        key={`stage-${currentRow?.id ?? 'none'}`}
        title={`推进商机阶段${currentRow?.name ? ` - ${currentRow.name}` : ''}`}
        open={stageOpen}
        onOpenChange={(open) => {
          setStageOpen(open);
          if (!open) setCurrentRow(undefined);
        }}
        width={480}
        modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          try {
            await stageMutation.mutateAsync({
              stage: values.stage as string,
              lostReason: values.lostReason as string | undefined,
            });
            return true;
          } catch {
            return false;
          }
        }}
      >
        <ProFormSelect
          name="stage"
          label="目标阶段"
          options={nextStages(currentRow?.stage).map((value) => ({
            label: stageText(value),
            value,
          }))}
          rules={[{ required: true, message: '请选择目标阶段' }]}
        />
        <ProFormDependency name={['stage']}>
          {({ stage }) => (
            <ProFormTextArea
              name="lostReason"
              label="丢单原因"
              fieldProps={{ rows: 3 }}
              rules={[
                {
                  required: stage === 'LOST',
                  message: '置为丢单时必须填写原因',
                },
              ]}
            />
          )}
        </ProFormDependency>
      </ModalForm>

      <Drawer
        title="商机详情"
        size={640}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      >
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="商机名称">
            {detail?.name ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="客户">
            {customerName(detail?.customerId)}
          </Descriptions.Item>
          <Descriptions.Item label="阶段">
            {stageText(detail?.stage)}
          </Descriptions.Item>
          <Descriptions.Item label="预计金额">
            {formatAmount(detail?.amount)} {detail?.currencyCode ?? ''}
          </Descriptions.Item>
          <Descriptions.Item label="本位币金额">
            {formatAmount(detail?.amountBase)} USD
          </Descriptions.Item>
          <Descriptions.Item label="赢率">
            {detail?.winRate ?? '-'}%
          </Descriptions.Item>
          <Descriptions.Item label="预计成交日">
            {detail?.expectCloseDate ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="竞争对手">
            {detail?.competitor ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="负责人">
            {ownerName(detail?.ownerId)}
          </Descriptions.Item>
          <Descriptions.Item label="丢单原因">
            {detail?.lostReason ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="备注">
            {detail?.remark ?? '-'}
          </Descriptions.Item>
        </Descriptions>
      </Drawer>

      <Drawer
        title="销售漏斗"
        size={640}
        open={pipelineOpen}
        onClose={() => setPipelineOpen(false)}
      >
        <Space orientation="vertical" size={16} style={{ width: '100%' }}>
          <div>
            商机总数：{pipeline?.totalCount ?? 0} ，赢单率：
            {pipeline?.winRate ?? 0}% ，合计金额：
            {formatAmount(pipeline?.totalAmountBase)} USD
          </div>
          <Table<Crm.StageBucket>
            rowKey="stage"
            size="small"
            pagination={false}
            dataSource={pipeline?.stages ?? []}
            columns={[
              { title: '阶段', dataIndex: 'stageName' },
              { title: '数量', dataIndex: 'count' },
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
        </Space>
      </Drawer>
    </PageContainer>
  );
};

export default OpportunityManage;
