import { EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import type {
  ActionType,
  ProColumns,
  ProFormInstance,
} from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormCheckbox,
  ProFormDatePicker,
  ProFormDigit,
  ProFormList,
  ProFormSelect,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { history } from '@umijs/max';
import { Button, Descriptions, Drawer, message, Space, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import ActionButton from '@/components/ActionButton';
import { createQuotationFromInquiry } from '@/services/crm/crmInquiry';
import { listCrmProducts } from '@/services/crm/crmProduct';
import {
  calculate,
  confirm as confirmQuotation,
  createQuotation,
  getQuotation,
  listQuotations,
  recalculate as recalculateQuotation,
  reject as rejectQuotation,
  submit as submitQuotation,
  updateQuotation,
} from '@/services/crm/crmQuotation';
import {
  useCustomerOptions,
  useInquiryOptions,
  useOwnerOptions,
} from '../hooks/useOptions';
import {
  CURRENCIES,
  formatAmount,
  INCOTERMS,
  QUOTATION_STATUS,
  toTableResult,
} from '../shared';

/** 报价明细的产品下拉（只列在售产品） */
async function fetchProductOptions() {
  const res = await listCrmProducts({ page: 1, size: 200 });
  return (res?.data?.data ?? [])
    .filter((product) => product.productStatus === 1)
    .map((product) => ({
      label: `${product.productCode ?? ''} ${product.productName ?? ''}`.trim(),
      value: product.id ?? '',
    }));
}

const QuotationManage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const createFormRef = useRef<ProFormInstance | undefined>(undefined);
  const editFormRef = useRef<ProFormInstance | undefined>(undefined);
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const { options: ownerOptions, nameOf: ownerName } = useOwnerOptions();
  const { options: customerOptions, nameOf: customerName } =
    useCustomerOptions();
  const { options: inquiryOptions } = useInquiryOptions();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<Crm.CrmQuotationDto>();
  const [detail, setDetail] = useState<Crm.CrmQuotationDto>();
  const [preview, setPreview] = useState<Crm.CrmQuotationDto>();

  /** 从询盘页跳转过来时携带 inquiryId / customerId / currencyCode */
  const query = Object.fromEntries(
    new URLSearchParams(window.location.search).entries(),
  );

  useEffect(() => {
    if (query.inquiryId) {
      setCreateOpen(true);
    }
    // 仅在首次带参进入时打开新建弹窗
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createMutation = useMutation({
    mutationFn: (values: Crm.CrmQuotationRequest) =>
      // 关联询盘时必须走 /inquiries/{id}/quotations：只有它会递增版本号并回填询盘首次回复时间
      values.inquiryId
        ? createQuotationFromInquiry({ id: values.inquiryId }, values)
        : createQuotation(values),
    onSuccess: () => {
      messageApi.success('报价单创建成功');
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      actionRef.current?.reload();
      setCreateOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: Crm.CrmQuotationRequest) =>
      updateQuotation({ id: currentRow?.id as string }, values),
    onSuccess: () => {
      messageApi.success('报价单更新成功');
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      actionRef.current?.reload();
      setEditOpen(false);
      setCurrentRow(undefined);
    },
  });

  const submitMutation = useMutation({
    mutationFn: (id: string) => submitQuotation({ id }),
    onSuccess: () => {
      messageApi.success('报价单已提交发送');
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      actionRef.current?.reload();
      refreshDetail();
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => confirmQuotation({ id }),
    onSuccess: () => {
      messageApi.success('报价单已确认');
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      actionRef.current?.reload();
      refreshDetail();
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (rejectReason: string) =>
      rejectQuotation({ id: currentRow?.id as string }, { rejectReason }),
    onSuccess: () => {
      messageApi.success('报价单已拒绝');
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      actionRef.current?.reload();
      setRejectOpen(false);
      refreshDetail();
    },
  });

  const recalculateMutation = useMutation({
    mutationFn: (id: string) => recalculateQuotation({ id }),
    onSuccess: () => {
      messageApi.success('已按当前加价率 / 折扣重算');
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      actionRef.current?.reload();
      refreshDetail();
    },
  });

  const refreshDetail = async () => {
    if (currentRow?.id) {
      const res = await getQuotation({ id: currentRow.id });
      setDetail(res?.data);
    }
  };

  const openDetail = async (id: string) => {
    const res = await getQuotation({ id });
    setCurrentRow(res?.data);
    setDetail(res?.data);
    setDetailOpen(true);
  };

  const openEdit = async (id: string) => {
    const res = await getQuotation({ id });
    setCurrentRow(res?.data);
    setEditOpen(true);
  };

  /** 试算：只算不落库 */
  const handleCalculate = async () => {
    const values = createFormRef.current?.getFieldsValue?.();
    if (!values) return;
    try {
      const res = await calculate(toQuotationRequest(values));
      setPreview(res?.data);
    } catch {
      setPreview(undefined);
    }
  };

  const toQuotationRequest = (values: any): Crm.CrmQuotationRequest => ({
    customerId: values.customerId,
    inquiryId: values.inquiryId,
    opportunityId: values.opportunityId,
    currencyCode: values.currencyCode,
    incoterm: values.incoterm,
    markupRate: values.markupRate,
    discountRate: values.discountRate,
    validUntil: values.validUntil
      ? String(values.validUntil).slice(0, 10)
      : undefined,
    ownerId: values.ownerId,
    remark: values.remark,
    items: (values.items ?? []).map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity,
      markupRate: item.markupRate,
      discountRate: item.discountRate,
      unitPrice: item.manualPrice ? item.unitPrice : undefined,
      manualPrice: item.manualPrice ?? false,
    })),
  });

  const columns: ProColumns<Crm.CrmQuotationDto>[] = [
    {
      title: '报价单号',
      dataIndex: 'quotationNo',
      width: 160,
      render: (_, record) => (
        <a
          onClick={() => record.id && openDetail(record.id)}
          style={{ marginRight: 8 }}
        >
          {record.quotationNo}
        </a>
      ),
    },
    { title: '版本', dataIndex: 'versionNo', width: 70, search: false },
    {
      title: '客户',
      dataIndex: 'customerId',
      width: 160,
      render: (_, record) => customerName(record.customerId),
    },
    { title: '币种', dataIndex: 'currencyCode', width: 80 },
    {
      title: '报价总额',
      dataIndex: 'totalAmount',
      width: 140,
      search: false,
      render: (_, record) => formatAmount(record.totalAmount),
    },
    {
      title: '成本',
      dataIndex: 'totalCost',
      width: 140,
      search: false,
      render: (_, record) => formatAmount(record.totalCost),
    },
    {
      title: '毛利',
      dataIndex: 'profitAmount',
      width: 140,
      search: false,
      render: (_, record) => formatAmount(record.profitAmount),
    },
    {
      title: '毛利率',
      dataIndex: 'profitRate',
      width: 100,
      search: false,
      render: (_, record) =>
        record.profitRate === undefined ? '-' : `${record.profitRate}%`,
    },
    {
      title: '来源询盘',
      dataIndex: 'inquiryId',
      hideInTable: true,
      valueType: 'select',
      fieldProps: { options: inquiryOptions },
    },
    {
      title: '状态',
      dataIndex: 'quotationStatus',
      width: 100,
      valueType: 'select',
      valueEnum: Object.fromEntries(
        Object.entries(QUOTATION_STATUS).map(([value, item]) => [
          value,
          { text: item.text, status: item.status },
        ]),
      ),
      render: (_, record) => {
        const status = QUOTATION_STATUS[record.quotationStatus ?? ''];
        return status ? <Tag color={status.status}>{status.text}</Tag> : '-';
      },
    },
    {
      title: '有效期至',
      dataIndex: 'validUntil',
      width: 120,
      search: false,
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
            key="detail"
            title="详情"
            icon={<EyeOutlined />}
            onClick={() => record.id && openDetail(record.id)}
          />
          {record.quotationStatus === 'DRAFT' ? (
            <ActionButton
              key="edit"
              title="编辑（仅草稿可改）"
              icon={<EditOutlined />}
              onClick={() => record.id && openEdit(record.id)}
            />
          ) : null}
        </Space>
      ),
    },
  ];

  const quotationFormItems = (
    <>
      <ProFormSelect
        name="customerId"
        label="客户"
        width="md"
        options={customerOptions}
        rules={[{ required: true, message: '请选择客户' }]}
      />
      <ProFormSelect
        name="currencyCode"
        label="币种（一单一币种）"
        width="sm"
        options={CURRENCIES.map((code) => ({ label: code, value: code }))}
        rules={[{ required: true, message: '请选择币种' }]}
      />
      <ProFormSelect
        name="incoterm"
        label="贸易术语"
        width="sm"
        options={INCOTERMS}
        initialValue="FOB"
        rules={[{ required: true, message: '请选择贸易术语' }]}
      />
      <ProFormDigit
        name="markupRate"
        label="加价率 %"
        width="sm"
        fieldProps={{ min: 0, max: 1000, precision: 2 }}
        initialValue={0}
      />
      <ProFormDigit
        name="discountRate"
        label="折扣率 %"
        width="sm"
        fieldProps={{ min: 0, max: 100, precision: 2 }}
        initialValue={0}
      />
      <ProFormDatePicker name="validUntil" label="有效期至" width="sm" />
      <ProFormSelect
        name="ownerId"
        label="负责人"
        width="sm"
        options={ownerOptions}
        rules={[{ required: true, message: '请选择负责人' }]}
      />
      <ProFormSelect
        name="inquiryId"
        label="来源询盘"
        width="md"
        options={inquiryOptions}
        tooltip="选择询盘后，报价单版本号在该询盘 + 币种下递增，并回填询盘首次回复时间"
      />
      <ProFormTextArea
        name="remark"
        label="备注"
        width="md"
        fieldProps={{ rows: 2 }}
      />

      <ProFormList
        name="items"
        min={1}
        creatorButtonProps={{ creatorButtonText: '新增报价明细' }}
      >
        <ProFormSelect
          name="productId"
          label="产品"
          width="md"
          rules={[{ required: true, message: '请选择产品' }]}
          request={fetchProductOptions}
        />
        <ProFormDigit
          name="quantity"
          label="数量"
          width="sm"
          fieldProps={{ min: 0, precision: 4 }}
          rules={[{ required: true, message: '请输入数量' }]}
        />
        <ProFormDigit
          name="markupRate"
          label="行加价率 %"
          width="sm"
          fieldProps={{ min: 0, max: 1000, precision: 2 }}
        />
        <ProFormDigit
          name="discountRate"
          label="行折扣率 %"
          width="sm"
          fieldProps={{ min: 0, max: 100, precision: 2 }}
        />
        <ProFormCheckbox
          name="manualPrice"
          label="手工改价"
          width="sm"
          tooltip="勾选后单价由人工填写，不再随加价率 / 折扣重算"
        />
        <ProFormDigit
          name="unitPrice"
          label="单价（手工改价时生效）"
          width="sm"
          fieldProps={{ min: 0, precision: 6 }}
        />
      </ProFormList>
    </>
  );

  return (
    <PageContainer>
      {contextHolder}
      <ProTable<Crm.CrmQuotationDto>
        headerTitle="报价单列表"
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
            新增报价单
          </Button>,
        ]}
        request={async (params) => {
          const { current = 1, pageSize = 10, ...rest } = params;
          const res = await listQuotations({
            page: current,
            size: pageSize,
            customerId: rest.customerId as string | undefined,
            quotationStatus: rest.quotationStatus as string | undefined,
            currencyCode: rest.currencyCode as string | undefined,
            inquiryId: rest.inquiryId as string | undefined,
            expired:
              rest.expired === undefined
                ? undefined
                : rest.expired === true || rest.expired === 'true',
          });
          return toTableResult<Crm.CrmQuotationDto>(res);
        }}
        columns={columns}
      />

      <ModalForm
        title="新增报价单"
        open={createOpen}
        onOpenChange={setCreateOpen}
        formRef={createFormRef}
        width={900}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        initialValues={{
          inquiryId: query.inquiryId,
          customerId: query.customerId,
          currencyCode: query.currencyCode ?? 'USD',
          incoterm: 'FOB',
          markupRate: 0,
          discountRate: 0,
          items: [{}],
        }}
        onFinish={async (values) => {
          try {
            await createMutation.mutateAsync(toQuotationRequest(values));
            return true;
          } catch {
            return false;
          }
        }}
      >
        <Button onClick={handleCalculate} style={{ marginBottom: 12 }}>
          试算（不落库）
        </Button>
        {quotationFormItems}
        {preview ? (
          <Table<Crm.CrmQuotationItemDto>
            size="small"
            rowKey="id"
            pagination={false}
            dataSource={preview.items ?? []}
            columns={[
              { title: '产品', dataIndex: 'productName' },
              { title: '数量', dataIndex: 'quantity' },
              {
                title: '成本单价',
                dataIndex: 'costPrice',
                render: (_, record) => formatAmount(record.costPrice),
              },
              {
                title: '单价',
                dataIndex: 'unitPrice',
                render: (_, record) => formatAmount(record.unitPrice),
              },
              {
                title: '金额',
                dataIndex: 'amount',
                render: (_, record) => formatAmount(record.amount),
              },
            ]}
          />
        ) : null}
        {preview ? (
          <Descriptions
            size="small"
            column={4}
            style={{ marginTop: 12 }}
            items={[
              {
                key: 'total',
                label: '报价总额',
                children: formatAmount(preview.totalAmount),
              },
              {
                key: 'cost',
                label: '成本汇总',
                children: formatAmount(preview.totalCost),
              },
              {
                key: 'profit',
                label: '毛利额',
                children: formatAmount(preview.profitAmount),
              },
              {
                key: 'rate',
                label: '毛利率',
                children: `${preview.profitRate ?? 0}%`,
              },
            ]}
          />
        ) : null}
      </ModalForm>

      <ModalForm
        key={currentRow?.id ?? 'quotation-edit'}
        title="编辑报价单（仅草稿可改）"
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setCurrentRow(undefined);
        }}
        formRef={editFormRef}
        width={900}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        initialValues={{
          customerId: currentRow?.customerId,
          currencyCode: currentRow?.currencyCode,
          incoterm: currentRow?.incoterm,
          markupRate: currentRow?.markupRate,
          discountRate: currentRow?.discountRate,
          validUntil: currentRow?.validUntil
            ? dayjs(currentRow.validUntil)
            : undefined,
          ownerId: currentRow?.ownerId,
          inquiryId: currentRow?.inquiryId,
          remark: currentRow?.remark,
          items: (currentRow?.items ?? []).map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            markupRate: item.markupRate,
            discountRate: item.discountRate,
            unitPrice: item.unitPrice,
            manualPrice: item.manualPrice,
          })),
        }}
        onFinish={async (values) => {
          try {
            await updateMutation.mutateAsync(toQuotationRequest(values));
            return true;
          } catch {
            return false;
          }
        }}
      >
        {quotationFormItems}
      </ModalForm>

      <ModalForm
        title="拒绝报价单"
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        width={480}
        modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          try {
            await rejectMutation.mutateAsync(values.rejectReason as string);
            return true;
          } catch {
            return false;
          }
        }}
      >
        <ProFormTextArea
          name="rejectReason"
          label="拒绝原因"
          fieldProps={{ rows: 3 }}
          rules={[{ required: true, message: '请填写拒绝原因' }]}
        />
      </ModalForm>

      <Drawer
        title="报价单详情"
        size={860}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        extra={
          <Space>
            {detail?.quotationStatus === 'DRAFT' ? (
              <>
                <Button
                  onClick={() =>
                    detail?.id && recalculateMutation.mutateAsync(detail.id)
                  }
                >
                  重算
                </Button>
                <Button
                  type="primary"
                  onClick={() =>
                    detail?.id && submitMutation.mutateAsync(detail.id)
                  }
                >
                  提交发送
                </Button>
              </>
            ) : null}
            {detail?.quotationStatus === 'SENT' ? (
              <>
                <Button onClick={() => setRejectOpen(true)}>拒绝</Button>
                <Button
                  type="primary"
                  onClick={() =>
                    detail?.id && confirmMutation.mutateAsync(detail.id)
                  }
                >
                  客户确认
                </Button>
              </>
            ) : null}
            {detail?.quotationStatus === 'CONFIRMED' ||
            detail?.quotationStatus === 'SENT' ? (
              <Button
                onClick={() =>
                  detail?.id &&
                  history.push(`/crm/order-manage?quotationId=${detail.id}`)
                }
              >
                转订单
              </Button>
            ) : null}
          </Space>
        }
      >
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="报价单号">
            {detail?.quotationNo ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="版本">
            {detail?.versionNo ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="客户">
            {customerName(detail?.customerId)}
          </Descriptions.Item>
          <Descriptions.Item label="币种">
            {detail?.currencyCode ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="贸易术语">
            {detail?.incoterm ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="负责人">
            {ownerName(detail?.ownerId)}
          </Descriptions.Item>
          <Descriptions.Item label="加价率">
            {detail?.markupRate ?? 0}%
          </Descriptions.Item>
          <Descriptions.Item label="折扣率">
            {detail?.discountRate ?? 0}%
          </Descriptions.Item>
          <Descriptions.Item label="报价总额">
            {formatAmount(detail?.totalAmount)} {detail?.currencyCode ?? ''}
          </Descriptions.Item>
          <Descriptions.Item label="成本汇总">
            {formatAmount(detail?.totalCost)}
          </Descriptions.Item>
          <Descriptions.Item label="毛利额">
            {formatAmount(detail?.profitAmount)}
          </Descriptions.Item>
          <Descriptions.Item label="毛利率">
            {detail?.profitRate ?? 0}%
          </Descriptions.Item>
          <Descriptions.Item label="本位币金额">
            {formatAmount(detail?.totalAmountBase)} USD
          </Descriptions.Item>
          <Descriptions.Item label="有效期至">
            {detail?.validUntil ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            {QUOTATION_STATUS[detail?.quotationStatus ?? '']?.text ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="拒绝原因">
            {detail?.rejectReason ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="备注" span={2}>
            {detail?.remark ?? '-'}
          </Descriptions.Item>
        </Descriptions>

        <Table<Crm.CrmQuotationItemDto>
          style={{ marginTop: 24 }}
          size="small"
          rowKey="id"
          pagination={false}
          dataSource={detail?.items ?? []}
          columns={[
            { title: '产品', dataIndex: 'productName' },
            { title: '规格', dataIndex: 'specification' },
            { title: '数量', dataIndex: 'quantity' },
            {
              title: '成本单价',
              dataIndex: 'costPrice',
              render: (_, record) => formatAmount(record.costPrice),
            },
            {
              title: '单价',
              dataIndex: 'unitPrice',
              render: (_, record) => formatAmount(record.unitPrice),
            },
            {
              title: '金额',
              dataIndex: 'amount',
              render: (_, record) => formatAmount(record.amount),
            },
            {
              title: '手工价',
              dataIndex: 'manualPrice',
              render: (_, record) => (record.manualPrice ? '是' : '否'),
            },
          ]}
        />
      </Drawer>
    </PageContainer>
  );
};

export default QuotationManage;
