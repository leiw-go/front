import { EditOutlined, PlusOutlined, WalletOutlined } from '@ant-design/icons';
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
import { Button, Card, message, Space, Tabs, Tag } from 'antd';
import dayjs from 'dayjs';
import { useRef, useState } from 'react';
import ActionButton from '@/components/ActionButton';
import {
  listReceivables,
  writeOffReceivable,
} from '@/services/crm/crmReceivable';
import {
  createShipment,
  listShipments,
  updateShipment,
} from '@/services/crm/crmShipment';
import { useOrderOptions } from '../hooks/useOptions';
import {
  formatAmount,
  PAYMENT_TERMS,
  RECEIVABLE_STATUS,
  RECEIVABLE_TYPES,
  SHIPMENT_STATUS,
  SHIPPING_TYPES,
  toTableResult,
} from '../shared';

const ShipmentManage: React.FC = () => {
  const shipmentActionRef = useRef<ActionType | null>(null);
  const receivableActionRef = useRef<ActionType | null>(null);
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const { options: orderOptions } = useOrderOptions();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [writeOffOpen, setWriteOffOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<Crm.CrmShipmentDto>();
  const [currentReceivable, setCurrentReceivable] =
    useState<Crm.CrmReceivableDto>();

  const createMutation = useMutation({
    mutationFn: (values: Crm.CrmShipmentRequest) => createShipment(values),
    onSuccess: () => {
      messageApi.success('发货单创建成功');
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      shipmentActionRef.current?.reload();
      setCreateOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: Crm.CrmShipmentRequest) =>
      updateShipment({ id: currentRow?.id as string }, values),
    onSuccess: () => {
      messageApi.success('发货单更新成功');
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      shipmentActionRef.current?.reload();
      setEditOpen(false);
      setCurrentRow(undefined);
    },
  });

  const writeOffMutation = useMutation({
    mutationFn: (values: Crm.CrmReceivableWriteOffRequest) =>
      writeOffReceivable({ id: currentReceivable?.id as string }, values),
    onSuccess: () => {
      messageApi.success('收款核销成功');
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      receivableActionRef.current?.reload();
      setWriteOffOpen(false);
      setCurrentReceivable(undefined);
    },
  });

  const shipmentColumns: ProColumns<Crm.CrmShipmentDto>[] = [
    { title: '运单 / 提单号', dataIndex: 'shippingNo', width: 170 },
    {
      title: '所属订单',
      dataIndex: 'orderId',
      width: 170,
      render: (_, record) =>
        orderOptions.find((option) => option.value === record.orderId)?.label ??
        record.orderId ??
        '-',
    },
    {
      title: '运输方式',
      dataIndex: 'shippingType',
      width: 100,
      valueType: 'select',
      valueEnum: Object.fromEntries(
        SHIPPING_TYPES.map((item) => [
          item.value,
          { text: item.label, status: 'Default' },
        ]),
      ),
      render: (_, record) =>
        SHIPPING_TYPES.find((item) => item.value === record.shippingType)
          ?.label ?? record.shippingType,
    },
    { title: '起运港', dataIndex: 'departurePort', width: 110 },
    { title: '目的港', dataIndex: 'destinationPort', width: 110 },
    { title: '发货日期', dataIndex: 'shipDate', width: 110 },
    { title: '预计到港', dataIndex: 'expectArriveDate', width: 110 },
    { title: '实际到港', dataIndex: 'actualArriveDate', width: 110 },
    {
      title: '体积 CBM',
      dataIndex: 'totalCbm',
      width: 100,
      search: false,
      render: (_, record) => formatAmount(record.totalCbm),
    },
    {
      title: '重量 kg',
      dataIndex: 'totalWeight',
      width: 100,
      search: false,
      render: (_, record) => formatAmount(record.totalWeight),
    },
    {
      title: '状态',
      dataIndex: 'shipmentStatus',
      width: 100,
      valueType: 'select',
      valueEnum: Object.fromEntries(
        Object.entries(SHIPMENT_STATUS).map(([value, item]) => [
          value,
          { text: item.text, status: item.status },
        ]),
      ),
      render: (_, record) => {
        const status = SHIPMENT_STATUS[record.shipmentStatus ?? ''];
        return status ? <Tag color={status.status}>{status.text}</Tag> : '-';
      },
    },
    {
      title: '操作',
      dataIndex: 'option',
      width: 70,
      fixed: 'right',
      search: false,
      render: (_, record) => (
        <Space size={4}>
          <ActionButton
            key="edit"
            title="编辑发货单"
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

  const receivableColumns: ProColumns<Crm.CrmReceivableDto>[] = [
    {
      title: '所属订单',
      dataIndex: 'orderId',
      width: 170,
      render: (_, record) =>
        orderOptions.find((option) => option.value === record.orderId)?.label ??
        record.orderId ??
        '-',
    },
    {
      title: '类型',
      dataIndex: 'receivableType',
      width: 90,
      valueType: 'select',
      valueEnum: Object.fromEntries(
        RECEIVABLE_TYPES.map((item) => [
          item.value,
          { text: item.label, status: 'Default' },
        ]),
      ),
      render: (_, record) =>
        RECEIVABLE_TYPES.find((item) => item.value === record.receivableType)
          ?.label ?? record.receivableType,
    },
    {
      title: '应收金额',
      dataIndex: 'receivableAmount',
      width: 130,
      search: false,
      render: (_, record) =>
        `${formatAmount(record.receivableAmount)} ${record.currencyCode ?? ''}`,
    },
    {
      title: '已收',
      dataIndex: 'receivedAmount',
      width: 120,
      search: false,
      render: (_, record) => formatAmount(record.receivedAmount),
    },
    {
      title: '未收',
      dataIndex: 'outstandingAmount',
      width: 120,
      search: false,
      render: (_, record) => formatAmount(record.outstandingAmount),
    },
    { title: '约定收款日', dataIndex: 'dueDate', width: 120 },
    {
      title: '状态',
      dataIndex: 'receivableStatus',
      width: 100,
      valueType: 'select',
      valueEnum: Object.fromEntries(
        Object.entries(RECEIVABLE_STATUS).map(([value, item]) => [
          value,
          { text: item.text, status: item.status },
        ]),
      ),
      render: (_, record) => {
        const status = RECEIVABLE_STATUS[record.receivableStatus ?? ''];
        return status ? <Tag color={status.status}>{status.text}</Tag> : '-';
      },
    },
    {
      title: '逾期天数',
      dataIndex: 'overdueDays',
      width: 90,
      search: false,
      render: (_, record) => record.overdueDays ?? 0,
    },
    {
      title: '操作',
      dataIndex: 'option',
      width: 70,
      fixed: 'right',
      search: false,
      render: (_, record) => (
        <Space size={4}>
          <ActionButton
            key="writeoff"
            title="登记收款（核销）"
            icon={<WalletOutlined />}
            onClick={() => {
              setCurrentReceivable(record);
              setWriteOffOpen(true);
            }}
          />
        </Space>
      ),
    },
  ];

  const shipmentFormItems = (
    <>
      <ProFormSelect
        name="orderId"
        label="所属订单"
        width="md"
        options={orderOptions}
        rules={[{ required: true, message: '请选择订单' }]}
      />
      <ProFormText name="shippingNo" label="运单 / 提单号" width="sm" />
      <ProFormSelect
        name="shippingType"
        label="运输方式"
        width="sm"
        options={SHIPPING_TYPES}
        initialValue="SEA"
        rules={[{ required: true, message: '请选择运输方式' }]}
      />
      <ProFormSelect
        name="shipmentStatus"
        label="状态"
        width="sm"
        options={Object.entries(SHIPMENT_STATUS).map(([value, item]) => ({
          label: item.text,
          value,
        }))}
        initialValue="PREPARING"
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
    </>
  );

  return (
    <PageContainer>
      {contextHolder}
      <Tabs
        defaultActiveKey="shipment"
        items={[
          {
            key: 'shipment',
            label: '发货单',
            children: (
              <ProTable<Crm.CrmShipmentDto>
                headerTitle="发货单列表"
                actionRef={shipmentActionRef}
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
                    新增发货单
                  </Button>,
                ]}
                request={async (params) => {
                  const { current = 1, pageSize = 10, ...rest } = params;
                  const res = await listShipments({
                    page: current,
                    size: pageSize,
                    orderId: rest.orderId as string | undefined,
                    shippingStatus: rest.shipmentStatus as string | undefined,
                  });
                  return toTableResult<Crm.CrmShipmentDto>(res);
                }}
                columns={shipmentColumns}
              />
            ),
          },
          {
            key: 'receivable',
            label: '应收',
            children: (
              <ProTable<Crm.CrmReceivableDto>
                headerTitle="应收列表"
                actionRef={receivableActionRef}
                rowKey="id"
                scroll={{ x: 'max-content' }}
                search={{ labelWidth: 'auto' }}
                request={async (params) => {
                  const { current = 1, pageSize = 10, ...rest } = params;
                  const res = await listReceivables({
                    page: current,
                    size: pageSize,
                    orderId: rest.orderId as string | undefined,
                    receivableStatus: rest.receivableStatus as
                      | string
                      | undefined,
                    overdueOnly:
                      rest.overdueOnly === undefined
                        ? undefined
                        : rest.overdueOnly === true ||
                          rest.overdueOnly === 'true',
                  });
                  return toTableResult<Crm.CrmReceivableDto>(res);
                }}
                columns={receivableColumns}
              />
            ),
          },
        ]}
      />

      <ModalForm
        title="新增发货单"
        open={createOpen}
        onOpenChange={setCreateOpen}
        width={760}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          try {
            await createMutation.mutateAsync(values as Crm.CrmShipmentRequest);
            return true;
          } catch {
            return false;
          }
        }}
      >
        {shipmentFormItems}
      </ModalForm>

      <ModalForm
        key={currentRow?.id ?? 'shipment-edit'}
        title="编辑发货单"
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setCurrentRow(undefined);
        }}
        initialValues={{
          orderId: currentRow?.orderId,
          shippingNo: currentRow?.shippingNo,
          shippingType: currentRow?.shippingType,
          shipmentStatus: currentRow?.shipmentStatus,
          departurePort: currentRow?.departurePort,
          destinationPort: currentRow?.destinationPort,
          shipDate: currentRow?.shipDate
            ? dayjs(currentRow.shipDate)
            : undefined,
          expectArriveDate: currentRow?.expectArriveDate
            ? dayjs(currentRow.expectArriveDate)
            : undefined,
          actualArriveDate: currentRow?.actualArriveDate
            ? dayjs(currentRow.actualArriveDate)
            : undefined,
          totalCbm: currentRow?.totalCbm,
          totalWeight: currentRow?.totalWeight,
          remark: currentRow?.remark,
        }}
        width={760}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          try {
            await updateMutation.mutateAsync(values as Crm.CrmShipmentRequest);
            return true;
          } catch {
            return false;
          }
        }}
      >
        {shipmentFormItems}
      </ModalForm>

      <ModalForm
        title="登记收款（核销）"
        open={writeOffOpen}
        onOpenChange={(open) => {
          setWriteOffOpen(open);
          if (!open) setCurrentReceivable(undefined);
        }}
        width={600}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        initialValues={{
          amount: currentReceivable?.outstandingAmount,
          paidDate: dayjs(),
          paymentMethod: 'TT',
        }}
        onFinish={async (values) => {
          try {
            await writeOffMutation.mutateAsync({
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
        <Card size="small" style={{ marginBottom: 16 }}>
          <div>
            应收：{formatAmount(currentReceivable?.receivableAmount)}{' '}
            {currentReceivable?.currencyCode ?? ''}
          </div>
          <div>
            未收：{formatAmount(currentReceivable?.outstandingAmount)}{' '}
            {currentReceivable?.currencyCode ?? ''}
          </div>
          <div>约定收款日：{currentReceivable?.dueDate ?? '-'}</div>
        </Card>
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
          rules={[{ required: true, message: '请选择收款日期' }]}
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
    </PageContainer>
  );
};

export default ShipmentManage;
