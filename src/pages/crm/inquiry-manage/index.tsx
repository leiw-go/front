import { EditOutlined, FileAddOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDatePicker,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { history } from '@umijs/max';
import { Button, Descriptions, Drawer, message, Space, Table, Tag } from 'antd';
import { useRef, useState } from 'react';
import ActionButton from '@/components/ActionButton';
import {
  createInquiry,
  getInquiry,
  listInquiries,
  updateInquiry,
} from '@/services/crm/crmInquiry';
import { useCustomerOptions, useOwnerOptions } from '../hooks/useOptions';
import {
  CURRENCIES,
  CUSTOMER_SOURCES,
  formatAmount,
  INQUIRY_STATUS,
  QUOTATION_STATUS,
  toTableResult,
  UNITS,
} from '../shared';

const InquiryManage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const { options: ownerOptions, nameOf: ownerName } = useOwnerOptions();
  const { options: customerOptions, nameOf: customerName } =
    useCustomerOptions();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<Crm.CrmInquiryDto>();
  const [detail, setDetail] = useState<Crm.CrmInquiryDto>();

  const createMutation = useMutation({
    mutationFn: (values: Crm.CrmInquiryRequest) => createInquiry(values),
    onSuccess: () => {
      messageApi.success('询盘创建成功');
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      actionRef.current?.reload();
      setCreateOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: Crm.CrmInquiryRequest) =>
      updateInquiry({ id: currentRow?.id as string }, values),
    onSuccess: () => {
      messageApi.success('询盘更新成功');
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      actionRef.current?.reload();
      setEditOpen(false);
      setCurrentRow(undefined);
    },
  });

  const openDetail = async (id: string) => {
    const res = await getInquiry({ id });
    setDetail(res?.data);
    setDetailOpen(true);
  };

  const goCreateQuotation = (inquiry: Crm.CrmInquiryDto) => {
    const params = new URLSearchParams({
      inquiryId: inquiry.id ?? '',
      customerId: inquiry.customerId ?? '',
      currencyCode: inquiry.currencyCode ?? 'USD',
    });
    history.push(`/crm/quotation?${params.toString()}`);
  };

  const columns: ProColumns<Crm.CrmInquiryDto>[] = [
    {
      title: '询盘编号',
      dataIndex: 'inquiryNo',
      width: 150,
      render: (_, record) => (
        <a
          onClick={() => record.id && openDetail(record.id)}
          style={{ marginRight: 8 }}
        >
          {record.inquiryNo}
        </a>
      ),
    },
    { title: '主题', dataIndex: 'subject', width: 200, ellipsis: true },
    {
      title: '客户',
      dataIndex: 'customerId',
      width: 160,
      render: (_, record) => customerName(record.customerId),
    },
    {
      title: '来源',
      dataIndex: 'source',
      width: 100,
      valueType: 'select',
      valueEnum: Object.fromEntries(
        CUSTOMER_SOURCES.map((item) => [
          item.value,
          { text: item.label, status: 'Default' },
        ]),
      ),
    },
    {
      title: '状态',
      dataIndex: 'inquiryStatus',
      width: 100,
      valueType: 'select',
      valueEnum: Object.fromEntries(
        Object.entries(INQUIRY_STATUS).map(([value, item]) => [
          value,
          { text: item.text, status: item.status },
        ]),
      ),
      render: (_, record) => {
        const status = INQUIRY_STATUS[record.inquiryStatus ?? ''];
        return status ? <Tag color={status.status}>{status.text}</Tag> : '-';
      },
    },
    {
      title: '目标价',
      dataIndex: 'targetPrice',
      width: 140,
      search: false,
      render: (_, record) =>
        record.targetPrice === undefined || record.targetPrice === null
          ? '-'
          : `${formatAmount(record.targetPrice)} ${record.currencyCode ?? ''}`,
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      width: 110,
      search: false,
      render: (_, record) =>
        record.quantity === undefined || record.quantity === null
          ? '-'
          : `${record.quantity} ${record.unit ?? ''}`,
    },
    {
      title: '待报价',
      dataIndex: 'pendingQuote',
      width: 100,
      valueType: 'select',
      valueEnum: {
        true: { text: '超时未报价', status: 'Warning' },
        false: { text: '正常', status: 'Default' },
      },
      render: (_, record) =>
        record.pendingQuote ? (
          <Tag color="warning">超时未报价</Tag>
        ) : (
          <Tag color="default">正常</Tag>
        ),
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
      width: 90,
      fixed: 'right',
      search: false,
      render: (_, record) => (
        <Space size={4}>
          <ActionButton
            key="quote"
            title="基于此询盘建报价单"
            icon={<FileAddOutlined />}
            onClick={() => goCreateQuotation(record)}
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
        </Space>
      ),
    },
  ];

  const inquiryFormItems = (
    <>
      <ProFormSelect
        name="customerId"
        label="客户"
        width="md"
        options={customerOptions}
        rules={[{ required: true, message: '请选择客户' }]}
      />
      <ProFormSelect
        name="source"
        label="来源渠道"
        width="sm"
        options={CUSTOMER_SOURCES}
        rules={[{ required: true, message: '请选择来源渠道' }]}
      />
      <ProFormSelect
        name="ownerId"
        label="负责人"
        width="sm"
        options={ownerOptions}
        rules={[{ required: true, message: '请选择负责人' }]}
      />
      <ProFormText name="subject" label="主题" width="md" />
      <ProFormDigit
        name="targetPrice"
        label="目标单价（仅参考）"
        width="sm"
        fieldProps={{ min: 0, precision: 6 }}
      />
      <ProFormSelect
        name="currencyCode"
        label="币种"
        width="sm"
        options={CURRENCIES.map((code) => ({ label: code, value: code }))}
        initialValue="USD"
      />
      <ProFormDigit
        name="quantity"
        label="数量"
        width="sm"
        fieldProps={{ min: 0, precision: 4 }}
      />
      <ProFormSelect
        name="unit"
        label="单位"
        width="sm"
        options={UNITS}
        initialValue="PCS"
      />
      <ProFormDatePicker
        name="expectDeliveryDate"
        label="期望交期"
        width="sm"
      />
      <ProFormSelect
        name="inquiryStatus"
        label="状态"
        width="sm"
        options={Object.entries(INQUIRY_STATUS).map(([value, item]) => ({
          label: item.text,
          value,
        }))}
        initialValue="NEW"
      />
      <ProFormTextArea
        name="content"
        label="原始需求内容"
        width="md"
        fieldProps={{ rows: 4 }}
      />
    </>
  );

  return (
    <PageContainer>
      {contextHolder}
      <ProTable<Crm.CrmInquiryDto>
        headerTitle="询盘列表"
        actionRef={actionRef}
        rowKey="id"
        scroll={{ x: 'max-content' }}
        search={{ labelWidth: 'auto' }}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateOpen(true)}
          >
            新增询盘
          </Button>,
        ]}
        request={async (params) => {
          const { current = 1, pageSize = 10, ...rest } = params;
          const res = await listInquiries({
            page: current,
            size: pageSize,
            inquiryStatus: rest.inquiryStatus as string | undefined,
            customerId: rest.customerId as string | undefined,
            source: rest.source as string | undefined,
            pendingQuote:
              rest.pendingQuote === undefined
                ? undefined
                : rest.pendingQuote === true || rest.pendingQuote === 'true',
          });
          return toTableResult<Crm.CrmInquiryDto>(res);
        }}
        columns={columns}
      />

      <ModalForm
        title="新增询盘"
        open={createOpen}
        onOpenChange={setCreateOpen}
        width={760}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          try {
            await createMutation.mutateAsync(values as Crm.CrmInquiryRequest);
            return true;
          } catch {
            return false;
          }
        }}
      >
        {inquiryFormItems}
      </ModalForm>

      <ModalForm
        key={currentRow?.id ?? 'inquiry-edit'}
        title="编辑询盘"
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
            await updateMutation.mutateAsync(values as Crm.CrmInquiryRequest);
            return true;
          } catch {
            return false;
          }
        }}
      >
        {inquiryFormItems}
      </ModalForm>

      <Drawer
        title="询盘详情"
        size={720}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        extra={
          <Space>
            <Button
              type="primary"
              onClick={() => detail && goCreateQuotation(detail)}
            >
              基于此询盘建报价单
            </Button>
          </Space>
        }
      >
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="询盘编号">
            {detail?.inquiryNo ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="主题">
            {detail?.subject ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="客户">
            {customerName(detail?.customerId)}
          </Descriptions.Item>
          <Descriptions.Item label="来源渠道">
            {CUSTOMER_SOURCES.find((item) => item.value === detail?.source)
              ?.label ??
              detail?.source ??
              '-'}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            {INQUIRY_STATUS[detail?.inquiryStatus ?? '']?.text ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="目标单价">
            {formatAmount(detail?.targetPrice)} {detail?.currencyCode ?? ''}
          </Descriptions.Item>
          <Descriptions.Item label="数量">
            {detail?.quantity ?? '-'} {detail?.unit ?? ''}
          </Descriptions.Item>
          <Descriptions.Item label="期望交期">
            {detail?.expectDeliveryDate ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="负责人">
            {ownerName(detail?.ownerId)}
          </Descriptions.Item>
          <Descriptions.Item label="首次回复时间">
            {detail?.firstReplyAt ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="需求内容">
            {detail?.content ?? '-'}
          </Descriptions.Item>
        </Descriptions>

        <Table<Crm.CrmQuotationSummaryDto>
          style={{ marginTop: 24 }}
          size="small"
          rowKey="id"
          pagination={false}
          dataSource={detail?.quotations ?? []}
          columns={[
            { title: '报价单号', dataIndex: 'quotationNo' },
            { title: '版本', dataIndex: 'versionNo' },
            { title: '币种', dataIndex: 'currencyCode' },
            {
              title: '金额',
              dataIndex: 'totalAmount',
              render: (_, record) => formatAmount(record.totalAmount),
            },
            {
              title: '状态',
              dataIndex: 'quotationStatus',
              render: (_, record) => {
                const status = QUOTATION_STATUS[record.quotationStatus ?? ''];
                return status ? (
                  <Tag color={status.status}>{status.text}</Tag>
                ) : (
                  '-'
                );
              },
            },
            { title: '有效期至', dataIndex: 'validUntil' },
          ]}
        />
      </Drawer>
    </PageContainer>
  );
};

export default InquiryManage;
