import {
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  PlusOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormCheckbox,
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
import { useRef, useState } from 'react';
import ActionButton from '@/components/ActionButton';
import {
  createContact,
  deleteContact,
  listCustomerContacts,
  updateContact,
} from '@/services/crm/crmContact';
import {
  createCustomer,
  deleteCustomer,
  exportCustomers,
  getCustomer,
  listCustomers,
  transferCustomer,
  updateCustomer,
} from '@/services/crm/crmCustomer';
import { useOwnerOptions } from '../hooks/useOptions';
import {
  CUSTOMER_LEVELS,
  CUSTOMER_SOURCES,
  CUSTOMER_STATUS,
  toTableResult,
} from '../shared';

const CustomerManage: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const { options: ownerOptions, nameOf: ownerName } = useOwnerOptions();

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<Crm.CustomerDto>();
  const [detail, setDetail] = useState<Crm.CustomerDto>();
  const [contacts, setContacts] = useState<Crm.CustomerContactDto[]>([]);
  const [contactOpen, setContactOpen] = useState(false);
  const [currentContact, setCurrentContact] =
    useState<Crm.CustomerContactDto>();
  /** 最近一次列表查询条件，导出时按同一条件取数 */
  const filtersRef = useRef<Record<string, any>>({});

  const createMutation = useMutation({
    mutationFn: (values: Crm.CustomerRequest) => createCustomer(values),
    onSuccess: () => {
      messageApi.success('客户创建成功');
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      actionRef.current?.reload();
      setCreateOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (values: Crm.CustomerRequest) =>
      updateCustomer({ id: currentRow?.id as string }, values),
    onSuccess: () => {
      messageApi.success('客户更新成功');
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      actionRef.current?.reload();
      setEditOpen(false);
      setCurrentRow(undefined);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCustomer({ id }),
    onSuccess: () => {
      messageApi.success('客户删除成功');
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      actionRef.current?.reload();
    },
  });

  const transferMutation = useMutation({
    mutationFn: (newOwnerId: string) =>
      transferCustomer({ id: currentRow?.id as string }, { newOwnerId }),
    onSuccess: () => {
      messageApi.success('客户转交成功');
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      actionRef.current?.reload();
      setTransferOpen(false);
      setCurrentRow(undefined);
    },
  });

  const contactCreateMutation = useMutation({
    mutationFn: (values: Crm.CustomerContactRequest) =>
      createContact({ customerId: detail?.id as string }, values),
    onSuccess: () => {
      messageApi.success('联系人创建成功');
      refreshContacts();
      setContactOpen(false);
      setCurrentContact(undefined);
    },
  });

  const contactUpdateMutation = useMutation({
    mutationFn: (values: Crm.CustomerContactRequest) =>
      updateContact({ contactId: currentContact?.id as string }, values),
    onSuccess: () => {
      messageApi.success('联系人更新成功');
      refreshContacts();
      setContactOpen(false);
      setCurrentContact(undefined);
    },
  });

  const contactDeleteMutation = useMutation({
    mutationFn: (id: string) => deleteContact({ contactId: id }),
    onSuccess: () => {
      messageApi.success('联系人删除成功');
      refreshContacts();
    },
  });

  const refreshContacts = async () => {
    if (!detail?.id) return;
    const res = await listCustomerContacts({ customerId: detail.id });
    setContacts(res?.data ?? []);
  };

  const openDetail = async (id: string) => {
    const res = await getCustomer({ id });
    setDetail(res?.data);
    setDetailOpen(true);
    const contactRes = await listCustomerContacts({ customerId: id });
    setContacts(contactRes?.data ?? []);
  };

  const handleExport = async (filters: Record<string, any>) => {
    const res = await exportCustomers(
      {
        companyName: filters.companyName,
        countryCode: filters.countryCode,
        level: filters.level,
        source: filters.source,
      },
      { responseType: 'blob' },
    );
    const blob = res as unknown as Blob;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `客户列表_${dayjs().format('YYYYMMDD_HHmmss')}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
    messageApi.success('导出成功');
  };

  const columns: ProColumns<Crm.CustomerDto>[] = [
    {
      title: '公司全称',
      dataIndex: 'companyName',
      width: 220,
      render: (_, record) => (
        <a
          onClick={() => record.id && openDetail(record.id)}
          style={{ marginRight: 8 }}
        >
          {record.companyName}
        </a>
      ),
    },
    { title: '简称', dataIndex: 'shortName', width: 120 },
    { title: '国家', dataIndex: 'countryCode', width: 80, search: false },
    {
      title: '等级',
      dataIndex: 'level',
      width: 90,
      valueType: 'select',
      valueEnum: Object.fromEntries(
        CUSTOMER_LEVELS.map((item) => [
          item.value,
          { text: item.value, status: 'Default' },
        ]),
      ),
      render: (_, record) =>
        record.level ? <Tag color="blue">{record.level}</Tag> : '-',
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
      dataIndex: 'customerStatus',
      width: 100,
      search: false,
      render: (_, record) => {
        const status = CUSTOMER_STATUS[record.customerStatus ?? ''];
        return status ? <Tag color={status.status}>{status.text}</Tag> : '-';
      },
    },
    {
      title: '负责人',
      dataIndex: 'ownerId',
      width: 110,
      search: false,
      render: (_, record) => ownerName(record.ownerId),
    },
    {
      title: '关联商机',
      dataIndex: 'opportunityCount',
      width: 90,
      search: false,
      render: (_, record) => record.opportunityCount ?? '-',
    },
    { title: '备注', dataIndex: 'remark', search: false, ellipsis: true },
    {
      title: '操作',
      dataIndex: 'option',
      width: 110,
      fixed: 'right',
      search: false,
      render: (_, record) => (
        <Space size={4}>
          <ActionButton
            key="edit"
            title="编辑"
            icon={<EditOutlined />}
            onClick={() => {
              setCurrentRow(record);
              setEditOpen(true);
            }}
          />
          <ActionButton
            key="transfer"
            title="转交负责人"
            icon={<UserSwitchOutlined />}
            onClick={() => {
              setCurrentRow(record);
              setTransferOpen(true);
            }}
          />
          <Popconfirm
            key="delete"
            title="确认删除该客户？"
            description="删除后不可在列表中恢复"
            onConfirm={() => record.id && deleteMutation.mutateAsync(record.id)}
          >
            <ActionButton title="删除" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      {contextHolder}
      <ProTable<Crm.CustomerDto>
        headerTitle="客户列表"
        actionRef={actionRef}
        rowKey="id"
        scroll={{ x: 'max-content' }}
        search={{ labelWidth: 'auto' }}
        toolBarRender={() => [
          <Button
            key="export"
            icon={<DownloadOutlined />}
            onClick={() => handleExport(filtersRef.current)}
          >
            导出 Excel
          </Button>,
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateOpen(true)}
          >
            新增客户
          </Button>,
        ]}
        request={async (params) => {
          const { current = 1, pageSize = 10, ...rest } = params;
          const filters = {
            companyName: rest.companyName as string | undefined,
            countryCode: rest.countryCode as string | undefined,
            level: rest.level as string | undefined,
            source: rest.source as string | undefined,
          };
          filtersRef.current = filters;
          const res = await listCustomers({
            page: current,
            size: pageSize,
            ...filters,
          });
          return toTableResult<Crm.CustomerDto>(res);
        }}
        columns={columns}
      />

      <ModalForm
        title="新增客户"
        open={createOpen}
        onOpenChange={setCreateOpen}
        width={720}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          try {
            await createMutation.mutateAsync(values as Crm.CustomerRequest);
            return true;
          } catch {
            return false;
          }
        }}
      >
        <ProFormText
          name="companyName"
          label="公司全称"
          width="md"
          rules={[{ required: true, message: '请输入公司全称' }]}
        />
        <ProFormText name="shortName" label="简称" width="sm" />
        <ProFormText
          name="countryCode"
          label="国家（ISO 2 位）"
          width="sm"
          placeholder="如 US"
          rules={[{ required: true, message: '请输入国家代码' }]}
        />
        <ProFormSelect
          name="source"
          label="来源渠道"
          width="sm"
          options={CUSTOMER_SOURCES}
          rules={[{ required: true, message: '请选择来源渠道' }]}
        />
        <ProFormSelect
          name="level"
          label="客户等级"
          width="sm"
          options={CUSTOMER_LEVELS}
          initialValue="B"
        />
        <ProFormSelect
          name="customerStatus"
          label="客户状态"
          width="sm"
          options={Object.entries(CUSTOMER_STATUS).map(([value, item]) => ({
            label: item.text,
            value,
          }))}
          initialValue="POTENTIAL"
        />
        <ProFormSelect
          name="ownerId"
          label="负责人"
          width="sm"
          options={ownerOptions}
          rules={[{ required: true, message: '请选择负责人' }]}
        />
        <ProFormText name="province" label="省 / 州" width="sm" />
        <ProFormText name="city" label="城市" width="sm" />
        <ProFormText name="industry" label="行业" width="sm" />
        <ProFormText name="website" label="官网" width="sm" />
        <ProFormTextArea
          name="address"
          label="地址"
          width="md"
          fieldProps={{ rows: 2 }}
        />
        <ProFormTextArea
          name="remark"
          label="备注"
          width="md"
          fieldProps={{ rows: 2 }}
        />
      </ModalForm>

      <ModalForm
        key={currentRow?.id ?? 'customer-edit'}
        title="编辑客户"
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setCurrentRow(undefined);
        }}
        initialValues={currentRow}
        width={720}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          try {
            await updateMutation.mutateAsync(values as Crm.CustomerRequest);
            return true;
          } catch {
            return false;
          }
        }}
      >
        <ProFormText
          name="companyName"
          label="公司全称"
          width="md"
          rules={[{ required: true, message: '请输入公司全称' }]}
        />
        <ProFormText name="shortName" label="简称" width="sm" />
        <ProFormText
          name="countryCode"
          label="国家（ISO 2 位）"
          width="sm"
          rules={[{ required: true, message: '请输入国家代码' }]}
        />
        <ProFormSelect
          name="source"
          label="来源渠道"
          width="sm"
          options={CUSTOMER_SOURCES}
          rules={[{ required: true, message: '请选择来源渠道' }]}
        />
        <ProFormSelect
          name="level"
          label="客户等级"
          width="sm"
          options={CUSTOMER_LEVELS}
        />
        <ProFormSelect
          name="customerStatus"
          label="客户状态"
          width="sm"
          options={Object.entries(CUSTOMER_STATUS).map(([value, item]) => ({
            label: item.text,
            value,
          }))}
        />
        <ProFormSelect
          name="ownerId"
          label="负责人"
          width="sm"
          options={ownerOptions}
          rules={[{ required: true, message: '请选择负责人' }]}
        />
        <ProFormText name="province" label="省 / 州" width="sm" />
        <ProFormText name="city" label="城市" width="sm" />
        <ProFormText name="industry" label="行业" width="sm" />
        <ProFormText name="website" label="官网" width="sm" />
        <ProFormTextArea
          name="address"
          label="地址"
          width="md"
          fieldProps={{ rows: 2 }}
        />
        <ProFormTextArea
          name="remark"
          label="备注"
          width="md"
          fieldProps={{ rows: 2 }}
        />
      </ModalForm>

      <ModalForm
        title={`转交客户负责人${currentRow?.companyName ? ` - ${currentRow.companyName}` : ''}`}
        open={transferOpen}
        onOpenChange={(open) => {
          setTransferOpen(open);
          if (!open) setCurrentRow(undefined);
        }}
        width={480}
        modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          try {
            await transferMutation.mutateAsync(values.newOwnerId as string);
            return true;
          } catch {
            return false;
          }
        }}
      >
        <ProFormSelect
          name="newOwnerId"
          label="新负责人"
          options={ownerOptions}
          rules={[{ required: true, message: '请选择新负责人' }]}
        />
      </ModalForm>

      <Drawer
        title="客户详情"
        size={640}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      >
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="公司全称">
            {detail?.companyName ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="简称">
            {detail?.shortName ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="国家">
            {detail?.countryCode ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="地址">
            {[detail?.province, detail?.city, detail?.address]
              .filter(Boolean)
              .join(' ') || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="官网">
            {detail?.website ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="行业">
            {detail?.industry ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="来源渠道">
            {CUSTOMER_SOURCES.find((item) => item.value === detail?.source)
              ?.label ??
              detail?.source ??
              '-'}
          </Descriptions.Item>
          <Descriptions.Item label="等级">
            {detail?.level ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            {CUSTOMER_STATUS[detail?.customerStatus ?? '']?.text ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="负责人">
            {ownerName(detail?.ownerId)}
          </Descriptions.Item>
          <Descriptions.Item label="联系人数量">
            {detail?.contactCount ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="关联商机数">
            {detail?.opportunityCount ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="备注">
            {detail?.remark ?? '-'}
          </Descriptions.Item>
        </Descriptions>

        <Typography.Title level={5}>
          联系人
          <Button
            type="link"
            size="small"
            onClick={() => {
              setCurrentContact(undefined);
              setContactOpen(true);
            }}
          >
            新增联系人
          </Button>
        </Typography.Title>
        <Table<Crm.CustomerContactDto>
          size="small"
          rowKey="id"
          pagination={false}
          dataSource={contacts}
          columns={[
            { title: '姓名', dataIndex: 'name' },
            { title: '职位', dataIndex: 'position' },
            { title: '邮箱', dataIndex: 'email' },
            { title: '电话', dataIndex: 'phone' },
            { title: 'WhatsApp', dataIndex: 'whatsapp' },
            {
              title: '主要联系人',
              dataIndex: 'isPrimary',
              render: (_, record) => (record.isPrimary ? '是' : ''),
            },
            {
              title: '操作',
              dataIndex: 'option',
              width: 80,
              render: (_, record) => (
                <Space size={4}>
                  <ActionButton
                    key="edit"
                    title="编辑"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setCurrentContact(record);
                      setContactOpen(true);
                    }}
                  />
                  <Popconfirm
                    key="delete"
                    title="确认删除该联系人？"
                    onConfirm={() =>
                      record.id && contactDeleteMutation.mutateAsync(record.id)
                    }
                  >
                    <ActionButton
                      title="删除"
                      icon={<DeleteOutlined />}
                      danger
                    />
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      </Drawer>

      <ModalForm
        key={currentContact?.id ?? 'contact-new'}
        title={currentContact ? '编辑联系人' : '新增联系人'}
        open={contactOpen}
        onOpenChange={(open) => {
          setContactOpen(open);
          if (!open) setCurrentContact(undefined);
        }}
        initialValues={currentContact}
        width={640}
        grid
        rowProps={{ gutter: 16 }}
        modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          try {
            if (currentContact?.id) {
              await contactUpdateMutation.mutateAsync(
                values as Crm.CustomerContactRequest,
              );
            } else {
              await contactCreateMutation.mutateAsync(
                values as Crm.CustomerContactRequest,
              );
            }
            return true;
          } catch {
            return false;
          }
        }}
      >
        <ProFormText
          name="name"
          label="姓名"
          rules={[{ required: true, message: '请输入姓名' }]}
        />
        <ProFormText name="position" label="职位" />
        <ProFormText name="email" label="邮箱" tooltip="同一客户下邮箱唯一" />
        <ProFormText
          name="phone"
          label="电话"
          tooltip="E.164 格式，如 +14155552671；同一客户内唯一"
        />
        <ProFormText
          name="whatsapp"
          label="WhatsApp"
          tooltip="E.164 格式，如 +14155552671"
        />
        <ProFormText name="language" label="沟通语言" placeholder="如 en" />
        <ProFormText
          name="timezone"
          label="时区"
          placeholder="如 Europe/Berlin"
        />
        <ProFormCheckbox
          name="isPrimary"
          label="主要联系人"
          initialValue={false}
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

export default CustomerManage;
