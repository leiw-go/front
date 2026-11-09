import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDatePicker,
  ProFormDependency,
  ProFormDigit,
  ProFormList,
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
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import ActionButton from '@/components/ActionButton';
import {
  createOrder,
  deleteOrder,
  getOrder,
  listOrders,
  receiveOrder,
  shipOrder,
  updateOrder,
} from '@/services/crm/crmOrder';
import {
  useCustomerOptions,
  useOwnerOptions,
  useProductOptions,
  useQuotationOptions,
} from '../hooks/useOptions';
import {
  CURRENCIES,
  formatAmount,
  INCOTERMS,
  ORDER_STATUS,
  PAYMENT_TERMS,
  RECEIVABLE_STATUS,
  SHIPPING_TYPES,
  toTableResult,
} from '../shared';

const OrderManage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const { options: ownerOptions, nameOf: ownerName } = useOwnerOptions();
  const { options: customerOptions, nameOf: customerName } =
    useCustomerOptions();
  const { options: quotationOptions } = useQuotationOptions();
  const { options: productOptions } = useProductOptions();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [shipOpen, setShipOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<Crm.CrmOrderDto>();
  const [detail, setDetail] = useState<Crm.CrmOrderDto>();

  /** 从报价单页跳转过来时携带 quotationId */
  const query = Object.fromEntries(
    new URLSearchParams(window.location.search).entries(),
  );
  useEffect(() => {
    if (query.quotationId) {
      setCreateOpen(true);
    }
    // 仅在首次带参进入时打开新建弹窗
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createMutation = useMutation({
    mutationFn: (values: Crm.CrmOrderRequest) => createOrder(values),
    onSuccess: () => {
      messageApi.success('订单创建成功');
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      actionRef.current?.reload();
      setCreateOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: Crm.CrmOrderRequest) =>
      updateOrder({ id: currentRow?.id as string }, values),
    onSuccess: () => {
      messageApi.success('订单更新成功');
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      actionRef.current?.reload();
      setEditOpen(false);
      setCurrentRow(undefined);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteOrder({ id }),
    onSuccess: () => {
      messageApi.success('订单删除成功');
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      actionRef.current?.reload();
    },
  });

  const shipMutation = useMutation({
    mutationFn: (values: Crm.CrmShipmentRequest) =>
      shipOrder({ id: currentRow?.id as string }, values),
    onSuccess: () => {
      messageApi.success('发货登记成功');
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      actionRef.current?.reload();
      setShipOpen(false);
      refreshDetail();
    },
  });

  const receiveMutation = useMutation({
    mutationFn: (values: Crm.CrmOrderReceiveRequest) =>
      receiveOrder({ id: currentRow?.id as string }, values),
    onSuccess: () => {
      messageApi.success('收款登记成功');
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      actionRef.current?.reload();
      setReceiveOpen(false);
      refreshDetail();
    },
  });

  const refreshDetail = async () => {
    if (currentRow?.id) {
      const res = await getOrder({ id: currentRow.id });
      setDetail(res?.data);
    }
  };

  const openDetail = async (id: string) => {
    const res = await getOrder({ id });
    setCurrentRow(res?.data);
    setDetail(res?.data);
    setDetailOpen(true);
  };

  const columns: ProColumns<Crm.CrmOrderDto>[] = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      width: 170,
      render: (_, record) => (
        <a
          onClick={() => record.id && openDetail(record.id)}
          style={{ marginRight: 8 }}
        >
          {record.orderNo}
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
      title: '订单金额',
      dataIndex: 'totalAmount',
      width: 150,
      search: false,
      render: (_, record) =>
        `${formatAmount(record.totalAmount)} ${record.currencyCode ?? ''}`,
    },
    {
      title: '付款方式',
      dataIndex: 'paymentTerm',
      width: 110,
      search: false,
      render: (_, record) =>
        PAYMENT_TERMS.find((item) => item.value === record.paymentTerm)
          ?.label ??
        record.paymentTerm ??
        '-',
    },
    {
      title: '定金比例',
      dataIndex: 'depositRate',
      width: 90,
      search: false,
      render: (_, record) =>
        record.depositRate === undefined ? '-' : `${record.depositRate}%`,
    },
    {
      title: '状态',
      dataIndex: 'orderStatus',
      width: 100,
      valueType: 'select',
      valueEnum: Object.fromEntries(
        Object.entries(ORDER_STATUS).map(([value, item]) => [
          value,
          { text: item.text, status: item.status },
        ]),
      ),
      render: (_, record) => {
        const status = ORDER_STATUS[record.orderStatus ?? ''];
        return status ? <Tag color={status.status}>{status.text}</Tag> : '-';
      },
    },
    {
      title: '发货日期',
      dataIndex: 'shipDate',
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
            key="detail"
            title="详情"
            icon={<EyeOutlined />}
            onClick={() => record.id && openDetail(record.id)}
          />
          {record.orderStatus === 'CONFIRMED' ? (
            <ActionButton
              key="edit"
              title="编辑（仅未发货可改）"
              icon={<EditOutlined />}
              onClick={() => {
                setCurrentRow(record);
                setEditOpen(true);
              }}
            />
          ) : null}
          <Popconfirm
            key="delete"
            title="确认删除该订单？"
            onConfirm={() => record.id && deleteMutation.mutateAsync(record.id)}
          >
            <ActionButton title="删除" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const orderFormItems = (
    <>
      <ProFormSelect
        name="customerId"
        label="客户"
        width="md"
        options={customerOptions}
        rules={[{ required: true, message: '请选择客户' }]}
      />
      <ProFormSelect
        name="quotationId"
        label="来源报价单"
        width="md"
        options={quotationOptions}
        tooltip="选择后由后端快照报价明细与金额，并自动把报价单置为已确认"
      />
      <ProFormSelect
        name="currencyCode"
        label="币种（一单一币种）"
        width="sm"
        options={CURRENCIES.map((code) => ({ label: code, value: code }))}
        initialValue="USD"
      />
      <ProFormSelect
        name="incoterm"
        label="贸易术语"
        width="sm"
        options={INCOTERMS}
        initialValue="FOB"
      />
      <ProFormSelect
        name="paymentTerm"
        label="付款方式"
        width="sm"
        options={PAYMENT_TERMS}
        initialValue="TT"
      />
      <ProFormDigit
        name="depositRate"
        label="定金比例 %"
        width="sm"
        fieldProps={{ min: 0, max: 100 }}
        initialValue={0}
        tooltip="决定应收拆分为定金 / 尾款两条"
      />
      <ProFormDatePicker name="shipDate" label="发货日期" width="sm" />
      <ProFormDatePicker
        name="expectArriveDate"
        label="预计到港日"
        width="sm"
      />
      <ProFormSelect
        name="ownerId"
        label="负责人"
        width="sm"
        options={ownerOptions}
        rules={[{ required: true, message: '请选择负责人' }]}
      />
      <ProFormTextArea
        name="remark"
        label="备注"
        width="md"
        fieldProps={{ rows: 2 }}
      />

      <ProFormDependency name={['quotationId']}>
        {({ quotationId }) =>
          quotationId ? null : (
            <ProFormList
              name="items"
              min={1}
              creatorButtonProps={{ creatorButtonText: '新增订单明细' }}
            >
              <ProFormSelect
                name="productId"
                label="产品"
                width="md"
                options={productOptions.map((option) => ({
                  label: option.label,
                  value: option.value,
                }))}
                rules={[{ required: true, message: '请选择产品' }]}
              />
              <ProFormText name="productName" label="产品名称" width="sm" />
              <ProFormText name="specification" label="规格" width="sm" />
              <ProFormDigit
                name="quantity"
                label="数量"
                width="sm"
                fieldProps={{ min: 0, precision: 4 }}
                rules={[{ required: true, message: '请输入数量' }]}
              />
              <ProFormText
                name="unit"
                label="单位"
                width="sm"
                initialValue="PCS"
              />
              <ProFormDigit
                name="unitPrice"
                label="单价"
                width="sm"
                fieldProps={{ min: 0, precision: 6 }}
                rules={[{ required: true, message: '请输入单价' }]}
              />
              <ProFormDigit
                name="amount"
                label="金额"
                width="sm"
                fieldProps={{ min: 0, precision: 2 }}
                rules={[{ required: true, message: '请输入金额' }]}
              />
            </ProFormList>
          )
        }
      </ProFormDependency>
    </>
  );

  return (
    <PageContainer>
      {contextHolder}
      <ProTable<Crm.CrmOrderDto>
        headerTitle="订单列表"
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
            新增订单
          </Button>,
        ]}
        request={async (params) => {
          const { current = 1, pageSize = 10, ...rest } = params;
          const res = await listOrders({
            page: current,
            size: pageSize,
            orderStatus: rest.orderStatus as string | undefined,
            customerId: rest.customerId as string | undefined,
            ownerId: rest.ownerId as string | undefined,
          });
          return toTableResult<Crm.CrmOrderDto>(res);
        }}
        columns={columns}
      />

      <ModalForm
        title="新增订单"
        open={createOpen}
        onOpenChange={setCreateOpen}
        width={900}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        initialValues={{
          quotationId: query.quotationId,
          customerId: query.customerId,
          currencyCode: query.currencyCode ?? 'USD',
          incoterm: 'FOB',
          paymentTerm: 'TT',
          depositRate: 0,
        }}
        onFinish={async (values) => {
          try {
            await createMutation.mutateAsync(values as Crm.CrmOrderRequest);
            return true;
          } catch {
            return false;
          }
        }}
      >
        {orderFormItems}
      </ModalForm>

      <ModalForm
        key={currentRow?.id ?? 'order-edit'}
        title="编辑订单（仅未发货可改）"
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setCurrentRow(undefined);
        }}
        initialValues={{
          customerId: currentRow?.customerId,
          currencyCode: currentRow?.currencyCode,
          incoterm: currentRow?.incoterm,
          paymentTerm: currentRow?.paymentTerm,
          depositRate: currentRow?.depositRate,
          shipDate: currentRow?.shipDate
            ? dayjs(currentRow.shipDate)
            : undefined,
          expectArriveDate: currentRow?.expectArriveDate
            ? dayjs(currentRow.expectArriveDate)
            : undefined,
          ownerId: currentRow?.ownerId,
          remark: currentRow?.remark,
          items: (currentRow?.items ?? []).map((item) => ({
            productId: item.productId,
            productName: item.productName,
            specification: item.specification,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            amount: item.amount,
          })),
        }}
        width={900}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          try {
            await updateMutation.mutateAsync(values as Crm.CrmOrderRequest);
            return true;
          } catch {
            return false;
          }
        }}
      >
        {orderFormItems}
      </ModalForm>

      <ModalForm
        title="登记发货"
        open={shipOpen}
        onOpenChange={setShipOpen}
        width={720}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          try {
            await shipMutation.mutateAsync({
              ...(values as Crm.CrmShipmentRequest),
              orderId: currentRow?.id,
            });
            return true;
          } catch {
            return false;
          }
        }}
      >
        <ProFormText name="shippingNo" label="运单 / 提单号" width="sm" />
        <ProFormSelect
          name="shippingType"
          label="运输方式"
          width="sm"
          options={SHIPPING_TYPES}
          initialValue="SEA"
          rules={[{ required: true, message: '请选择运输方式' }]}
        />
        <ProFormText name="departurePort" label="起运港" width="sm" />
        <ProFormText name="destinationPort" label="目的港" width="sm" />
        <ProFormDatePicker name="shipDate" label="发货日期" width="sm" />
        <ProFormDatePicker
          name="expectArriveDate"
          label="预计到港日"
          width="sm"
        />
        <ProFormDatePicker
          name="actualArriveDate"
          label="实际到港日"
          width="sm"
        />
        <ProFormDigit
          name="totalCbm"
          label="总体积 CBM"
          width="sm"
          fieldProps={{ min: 0, precision: 3 }}
        />
        <ProFormDigit
          name="totalWeight"
          label="总重量 kg"
          width="sm"
          fieldProps={{ min: 0, precision: 3 }}
        />
        <ProFormTextArea
          name="remark"
          label="备注"
          width="md"
          fieldProps={{ rows: 2 }}
        />
      </ModalForm>

      <ModalForm
        title="登记收款"
        open={receiveOpen}
        onOpenChange={setReceiveOpen}
        width={640}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          try {
            await receiveMutation.mutateAsync({
              receivableId: values.receivableId as string,
              amount: values.amount as number,
              paidDate: values.paidDate
                ? String(values.paidDate).slice(0, 10)
                : undefined,
              paymentMethod: values.paymentMethod as string,
              remark: values.remark as string | undefined,
            });
            return true;
          } catch {
            return false;
          }
        }}
      >
        <ProFormSelect
          name="receivableId"
          label="核销应收"
          width="md"
          options={(detail?.receivables ?? []).map((receivable) => ({
            label: `${receivable.receivableType === 'DEPOSIT' ? '定金' : receivable.receivableType === 'BALANCE' ? '尾款' : '全款'} ${formatAmount(
              receivable.receivableAmount,
            )} ${receivable.currencyCode ?? ''}（未收 ${formatAmount(
              receivable.outstandingAmount,
            )}）`,
            value: receivable.id ?? '',
          }))}
          rules={[{ required: true, message: '请选择要核销的应收' }]}
        />
        <ProFormDigit
          name="amount"
          label="收款金额"
          width="sm"
          fieldProps={{ min: 0, precision: 2 }}
          rules={[{ required: true, message: '请输入收款金额' }]}
        />
        <ProFormDatePicker
          name="paidDate"
          label="收款日期"
          width="sm"
          initialValue={dayjs()}
        />
        <ProFormSelect
          name="paymentMethod"
          label="收款方式"
          width="sm"
          options={PAYMENT_TERMS}
          initialValue="TT"
        />
        <ProFormTextArea
          name="remark"
          label="备注"
          width="md"
          fieldProps={{ rows: 2 }}
        />
      </ModalForm>

      <Drawer
        title="订单详情"
        size={900}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        extra={
          <Space>
            <Button
              onClick={() => {
                setCurrentRow(detail);
                setShipOpen(true);
              }}
            >
              登记发货
            </Button>
            <Button
              type="primary"
              onClick={() => {
                setCurrentRow(detail);
                setReceiveOpen(true);
              }}
            >
              登记收款
            </Button>
          </Space>
        }
      >
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="订单号">
            {detail?.orderNo ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="客户">
            {customerName(detail?.customerId)}
          </Descriptions.Item>
          <Descriptions.Item label="订单金额">
            {formatAmount(detail?.totalAmount)} {detail?.currencyCode ?? ''}
          </Descriptions.Item>
          <Descriptions.Item label="本位币金额">
            {formatAmount(detail?.totalAmountBase)} USD
          </Descriptions.Item>
          <Descriptions.Item label="贸易术语">
            {detail?.incoterm ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="付款方式">
            {detail?.paymentTerm ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="定金比例">
            {detail?.depositRate ?? 0}%
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            {ORDER_STATUS[detail?.orderStatus ?? '']?.text ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="发货日期">
            {detail?.shipDate ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="预计到港日">
            {detail?.expectArriveDate ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="负责人">
            {ownerName(detail?.ownerId)}
          </Descriptions.Item>
          <Descriptions.Item label="备注">
            {detail?.remark ?? '-'}
          </Descriptions.Item>
        </Descriptions>

        <Typography.Title level={5}>订单明细</Typography.Title>
        <Table<Crm.CrmOrderItemDto>
          size="small"
          rowKey="id"
          pagination={false}
          dataSource={detail?.items ?? []}
          columns={[
            { title: '产品', dataIndex: 'productName' },
            { title: '规格', dataIndex: 'specification' },
            { title: '数量', dataIndex: 'quantity' },
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

        <Typography.Title level={5}>发货记录</Typography.Title>
        <Table<Crm.CrmShipmentDto>
          size="small"
          rowKey="id"
          pagination={false}
          dataSource={detail?.shipments ?? []}
          columns={[
            { title: '运单号', dataIndex: 'shippingNo' },
            {
              title: '运输方式',
              dataIndex: 'shippingType',
              render: (_, record) =>
                SHIPPING_TYPES.find(
                  (item) => item.value === record.shippingType,
                )?.label ?? record.shippingType,
            },
            { title: '起运港', dataIndex: 'departurePort' },
            { title: '目的港', dataIndex: 'destinationPort' },
            { title: '发货日期', dataIndex: 'shipDate' },
            { title: '实际到港', dataIndex: 'actualArriveDate' },
          ]}
        />

        <Typography.Title level={5}>应收明细</Typography.Title>
        <Table<Crm.CrmReceivableDto>
          size="small"
          rowKey="id"
          pagination={false}
          dataSource={detail?.receivables ?? []}
          columns={[
            {
              title: '类型',
              dataIndex: 'receivableType',
              render: (_, record) =>
                record.receivableType === 'DEPOSIT'
                  ? '定金'
                  : record.receivableType === 'BALANCE'
                    ? '尾款'
                    : '全款',
            },
            {
              title: '应收',
              dataIndex: 'receivableAmount',
              render: (_, record) => formatAmount(record.receivableAmount),
            },
            {
              title: '已收',
              dataIndex: 'receivedAmount',
              render: (_, record) => formatAmount(record.receivedAmount),
            },
            {
              title: '未收',
              dataIndex: 'outstandingAmount',
              render: (_, record) => formatAmount(record.outstandingAmount),
            },
            { title: '约定收款日', dataIndex: 'dueDate' },
            {
              title: '状态',
              dataIndex: 'receivableStatus',
              render: (_, record) => {
                const status = RECEIVABLE_STATUS[record.receivableStatus ?? ''];
                return status ? (
                  <Tag color={status.status}>{status.text}</Tag>
                ) : (
                  '-'
                );
              },
            },
          ]}
        />
      </Drawer>
    </PageContainer>
  );
};

export default OrderManage;
