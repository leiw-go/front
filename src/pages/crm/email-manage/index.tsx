import {
  AuditOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  SendOutlined,
} from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormDependency,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Descriptions,
  Drawer,
  message,
  Popconfirm,
  Space,
  Table,
  Tabs,
  Tag,
} from 'antd';
import { useRef, useState } from 'react';
import ActionButton from '@/components/ActionButton';
import {
  createEmailCampaign,
  deleteEmailTemplate,
  listEmailCampaignLogs,
  listEmailCampaigns,
  listEmailTemplates,
  previewEmailTemplate,
  saveEmailTemplate,
  sendEmailCampaign,
} from '@/services/crm/crmEmail';
import { useCustomerOptions, useOwnerOptions } from '../hooks/useOptions';
import {
  EMAIL_CAMPAIGN_STATUS,
  EMAIL_TARGET_TYPES,
  EMAIL_TEMPLATE_TYPES,
} from '../shared';

const EmailManage: React.FC = () => {
  const templateActionRef = useRef<any>(null);
  const campaignActionRef = useRef<any>(null);
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const { options: ownerOptions } = useOwnerOptions();
  const { options: customerOptions } = useCustomerOptions();

  const [templateOpen, setTemplateOpen] = useState(false);
  const [campaignOpen, setCampaignOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [currentTemplate, setCurrentTemplate] =
    useState<Crm.CrmEmailTemplateDto>();
  const [preview, setPreview] = useState<Crm.CrmEmailPreviewDto>();
  const [logs, setLogs] = useState<Crm.CrmEmailLogDto[]>([]);

  const saveTemplateMutation = useMutation({
    mutationFn: (values: Crm.CrmEmailTemplateRequest) =>
      saveEmailTemplate(values),
    onSuccess: () => {
      messageApi.success('模板保存成功');
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      templateActionRef.current?.reload?.();
      setTemplateOpen(false);
      setCurrentTemplate(undefined);
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => deleteEmailTemplate({ id }),
    onSuccess: () => {
      messageApi.success('模板删除成功');
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      templateActionRef.current?.reload?.();
    },
  });

  const previewMutation = useMutation({
    mutationFn: (id: string) => previewEmailTemplate({ id }),
    onSuccess: (res) => {
      setPreview(res?.data);
      setPreviewOpen(true);
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: (values: Crm.CrmEmailCampaignRequest) =>
      createEmailCampaign(values),
    onSuccess: () => {
      messageApi.success('群发任务创建成功');
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      campaignActionRef.current?.reload?.();
      setCampaignOpen(false);
    },
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => sendEmailCampaign({ id }),
    onSuccess: () => {
      messageApi.success('群发任务已执行');
      queryClient.invalidateQueries({ queryKey: ['crm'] });
      campaignActionRef.current?.reload?.();
    },
  });

  const openLogs = async (id: string) => {
    const res = await listEmailCampaignLogs({ id });
    setLogs(res?.data ?? []);
    setLogOpen(true);
  };

  const templateColumns: ProColumns<Crm.CrmEmailTemplateDto>[] = [
    { title: '模板名称', dataIndex: 'name', width: 180 },
    { title: '主题', dataIndex: 'subject', width: 220, ellipsis: true },
    {
      title: '语言',
      dataIndex: 'language',
      width: 90,
      render: (_, record) => record.language?.toUpperCase() ?? '-',
    },
    {
      title: '类型',
      dataIndex: 'templateType',
      width: 120,
      render: (_, record) =>
        EMAIL_TEMPLATE_TYPES.find((item) => item.value === record.templateType)
          ?.label ??
        record.templateType ??
        '-',
    },
    {
      title: '操作',
      dataIndex: 'option',
      width: 110,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <ActionButton
            key="edit"
            title="编辑"
            icon={<EditOutlined />}
            onClick={() => {
              setCurrentTemplate(record);
              setTemplateOpen(true);
            }}
          />
          <ActionButton
            key="preview"
            title="预览渲染结果"
            icon={<EyeOutlined />}
            onClick={() => record.id && previewMutation.mutateAsync(record.id)}
          />
          <Popconfirm
            key="delete"
            title="确认删除该模板？"
            onConfirm={() =>
              record.id && deleteTemplateMutation.mutateAsync(record.id)
            }
          >
            <ActionButton title="删除" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const campaignColumns: ProColumns<Crm.CrmEmailCampaignDto>[] = [
    { title: '任务名称', dataIndex: 'name', width: 180 },
    {
      title: '范围',
      dataIndex: 'targetType',
      width: 160,
      render: (_, record) => {
        const type = EMAIL_TARGET_TYPES.find(
          (item) => item.value === record.targetType,
        );
        const value =
          record.targetType === 'OWNER'
            ? (ownerOptions.find((o) => o.value === record.targetValue)
                ?.label ?? record.targetValue)
            : record.targetType === 'CUSTOMER'
              ? (customerOptions.find((o) => o.value === record.targetValue)
                  ?.label ?? record.targetValue)
              : record.targetValue;
        return `${type?.label ?? record.targetType}：${value ?? '-'}`;
      },
    },
    {
      title: '状态',
      dataIndex: 'campaignStatus',
      width: 100,
      render: (_, record) => {
        const status = EMAIL_CAMPAIGN_STATUS[record.campaignStatus ?? ''];
        return status ? <Tag color={status.status}>{status.text}</Tag> : '-';
      },
    },
    { title: '总数', dataIndex: 'totalCount', width: 80 },
    { title: '成功', dataIndex: 'successCount', width: 80 },
    { title: '失败', dataIndex: 'failCount', width: 80 },
    { title: '发送时间', dataIndex: 'sentAt', width: 160 },
    {
      title: '操作',
      dataIndex: 'option',
      width: 90,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <ActionButton
            key="send"
            title="执行发送"
            icon={<SendOutlined />}
            onClick={() => record.id && sendMutation.mutateAsync(record.id)}
          />
          <ActionButton
            key="logs"
            title="发送明细"
            icon={<AuditOutlined />}
            onClick={() => record.id && openLogs(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      {contextHolder}
      <Tabs
        defaultActiveKey="template"
        items={[
          {
            key: 'template',
            label: '邮件模板',
            children: (
              <ProTable<Crm.CrmEmailTemplateDto>
                headerTitle="邮件模板列表"
                actionRef={templateActionRef}
                rowKey="id"
                scroll={{ x: 'max-content' }}
                search={false}
                pagination={false}
                toolBarRender={() => [
                  <Button
                    key="add"
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setCurrentTemplate(undefined);
                      setTemplateOpen(true);
                    }}
                  >
                    新增模板
                  </Button>,
                ]}
                request={async () => {
                  const res = await listEmailTemplates();
                  return {
                    data: res?.data ?? [],
                    success: res?.code === 200,
                  };
                }}
                columns={templateColumns}
              />
            ),
          },
          {
            key: 'campaign',
            label: '群发任务',
            children: (
              <ProTable<Crm.CrmEmailCampaignDto>
                headerTitle="群发任务列表"
                actionRef={campaignActionRef}
                rowKey="id"
                scroll={{ x: 'max-content' }}
                search={false}
                pagination={false}
                toolBarRender={() => [
                  <Button
                    key="add"
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setCampaignOpen(true)}
                  >
                    新建群发
                  </Button>,
                ]}
                request={async () => {
                  const res = await listEmailCampaigns({});
                  return {
                    data: res?.data ?? [],
                    success: res?.code === 200,
                  };
                }}
                columns={campaignColumns}
              />
            ),
          },
        ]}
      />

      <ModalForm
        key={currentTemplate?.id ?? 'template-new'}
        title={currentTemplate ? '编辑邮件模板' : '新增邮件模板'}
        open={templateOpen}
        onOpenChange={(open) => {
          setTemplateOpen(open);
          if (!open) setCurrentTemplate(undefined);
        }}
        initialValues={currentTemplate}
        width={760}
        modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          try {
            await saveTemplateMutation.mutateAsync({
              ...(values as Crm.CrmEmailTemplateRequest),
              id: currentTemplate?.id,
            });
            return true;
          } catch {
            return false;
          }
        }}
      >
        <ProFormText
          name="name"
          label="模板名称"
          rules={[{ required: true, message: '请输入模板名称' }]}
        />
        <ProFormText
          name="subject"
          label="邮件主题"
          rules={[{ required: true, message: '请输入邮件主题' }]}
          tooltip="变量占位形如 {{customer.company_name}}"
        />
        <ProFormSelect
          name="templateType"
          label="模板类型"
          options={EMAIL_TEMPLATE_TYPES}
          initialValue="DEVELOP"
          rules={[{ required: true, message: '请选择模板类型' }]}
        />
        <ProFormText name="language" label="语言分类" initialValue="zh" />
        <ProFormTextArea
          name="content"
          label="正文"
          fieldProps={{ rows: 10 }}
          rules={[{ required: true, message: '请输入正文' }]}
        />
      </ModalForm>

      <ModalForm
        title="新建群发任务"
        open={campaignOpen}
        onOpenChange={setCampaignOpen}
        width={640}
        modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          try {
            await createCampaignMutation.mutateAsync(
              values as Crm.CrmEmailCampaignRequest,
            );
            return true;
          } catch {
            return false;
          }
        }}
      >
        <ProFormText
          name="name"
          label="任务名称"
          rules={[{ required: true, message: '请输入任务名称' }]}
        />
        <ProFormSelect
          name="templateId"
          label="邮件模板"
          options={[]}
          request={async () => {
            const res = await listEmailTemplates();
            return (res?.data ?? []).map((template) => ({
              label: `${template.name ?? ''}（${template.subject ?? ''}）`,
              value: template.id ?? '',
            }));
          }}
          rules={[{ required: true, message: '请选择邮件模板' }]}
        />
        <ProFormSelect
          name="targetType"
          label="发送范围"
          options={EMAIL_TARGET_TYPES}
          initialValue="TAG"
          rules={[{ required: true, message: '请选择发送范围' }]}
        />
        <ProFormDependency name={['targetType']}>
          {({ targetType }: any) => {
            if (targetType === 'OWNER') {
              return (
                <ProFormSelect
                  name="targetValue"
                  label="负责人"
                  options={ownerOptions}
                  rules={[{ required: true, message: '请选择负责人' }]}
                />
              );
            }
            if (targetType === 'CUSTOMER') {
              return (
                <ProFormSelect
                  name="targetValue"
                  label="客户"
                  options={customerOptions}
                  rules={[{ required: true, message: '请选择客户' }]}
                />
              );
            }
            return (
              <ProFormText
                name="targetValue"
                label="客户标签"
                placeholder="标签名称"
                rules={[{ required: true, message: '请输入客户标签' }]}
              />
            );
          }}
        </ProFormDependency>
      </ModalForm>

      <Drawer
        title="模板预览"
        size={720}
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
      >
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="主题">
            {preview?.subject ?? '-'}
          </Descriptions.Item>
        </Descriptions>
        <Card size="small" style={{ marginTop: 16 }}>
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
            {preview?.content ?? '-'}
          </pre>
        </Card>
        {preview?.unresolvedPlaceholders?.length ? (
          <div style={{ marginTop: 12, color: '#faad14' }}>
            未解析变量：
            {preview.unresolvedPlaceholders.join('、')}
          </div>
        ) : null}
      </Drawer>

      <Drawer
        title="发送明细"
        size={860}
        open={logOpen}
        onClose={() => setLogOpen(false)}
      >
        <Table<Crm.CrmEmailLogDto>
          rowKey="id"
          size="small"
          pagination={false}
          dataSource={logs}
          columns={[
            { title: '邮箱', dataIndex: 'email' },
            { title: '状态', dataIndex: 'sendStatus' },
            { title: '失败原因', dataIndex: 'errorMsg' },
            { title: '发送时间', dataIndex: 'sentAt' },
          ]}
        />
      </Drawer>
    </PageContainer>
  );
};

export default EmailManage;
