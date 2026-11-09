import {
  CheckOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  ProTable,
} from '@ant-design/pro-components';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Badge,
  Button,
  Descriptions,
  Drawer,
  message,
  Popconfirm,
  Space,
  Tag,
} from 'antd';
import { useRef, useState } from 'react';
import ActionButton from '@/components/ActionButton';
import {
  deleteMessage,
  getMessage,
  getUnreadMessageCount,
  listMessages,
  markAllMessagesRead,
  markMessageRead,
  sendMessage,
} from '@/services/crm/crmMessage';
import { useOwnerOptions } from '../hooks/useOptions';
import { MESSAGE_LEVELS, MESSAGE_TYPES, toTableResult } from '../shared';

const MessageCenter: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);
  const queryClient = useQueryClient();
  const [messageApi, contextHolder] = message.useMessage();
  const { options: ownerOptions, nameOf: ownerName } = useOwnerOptions();

  const [detailOpen, setDetailOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [detail, setDetail] = useState<Crm.MessageDto>();

  /** 未读数：需求要求前端每 30~60 秒轮询一次 */
  const unreadQuery = useQuery({
    queryKey: ['crm', 'message', 'unread-count'],
    queryFn: async () => {
      const res = await getUnreadMessageCount();
      // 后端返回 { unreadCount: n }
      return Number(res?.data?.unreadCount ?? 0);
    },
    refetchInterval: 60000,
  });

  const readMutation = useMutation({
    mutationFn: (id: string) => markMessageRead({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm', 'message'] });
      actionRef.current?.reload();
    },
  });

  const readAllMutation = useMutation({
    mutationFn: (body: Crm.MessageQueryRequest) => markAllMessagesRead(body),
    onSuccess: () => {
      messageApi.success('已全部标记为已读');
      queryClient.invalidateQueries({ queryKey: ['crm', 'message'] });
      actionRef.current?.reload();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMessage({ id }),
    onSuccess: () => {
      messageApi.success('消息已删除');
      queryClient.invalidateQueries({ queryKey: ['crm', 'message'] });
      actionRef.current?.reload();
    },
  });

  const sendMutation = useMutation({
    mutationFn: (values: Crm.MessageSendRequest) => sendMessage(values),
    onSuccess: () => {
      messageApi.success('消息已发送');
      queryClient.invalidateQueries({ queryKey: ['crm', 'message'] });
      actionRef.current?.reload();
      setSendOpen(false);
    },
  });

  /** 打开详情：后端在读取详情时自动标记已读 */
  const openDetail = async (id: string) => {
    const res = await getMessage({ id });
    setDetail(res?.data);
    setDetailOpen(true);
    queryClient.invalidateQueries({ queryKey: ['crm', 'message'] });
    actionRef.current?.reload();
  };

  const columns: ProColumns<Crm.MessageDto>[] = [
    {
      title: '标题',
      dataIndex: 'title',
      width: 240,
      render: (_, record) => (
        <a
          onClick={() => record.id && openDetail(record.id)}
          style={{
            marginRight: 8,
            fontWeight: record.read ? undefined : 600,
          }}
        >
          {record.title}
        </a>
      ),
    },
    {
      title: '类型',
      dataIndex: 'messageType',
      width: 140,
      valueType: 'select',
      valueEnum: Object.fromEntries(
        MESSAGE_TYPES.map((item) => [
          item.value,
          { text: item.label, status: 'Default' },
        ]),
      ),
      render: (_, record) =>
        MESSAGE_TYPES.find((item) => item.value === record.messageType)
          ?.label ??
        record.messageType ??
        '-',
    },
    {
      title: '级别',
      dataIndex: 'level',
      width: 90,
      valueType: 'select',
      valueEnum: Object.fromEntries(
        Object.entries(MESSAGE_LEVELS).map(([value, item]) => [
          value,
          { text: item.text, status: item.status },
        ]),
      ),
      render: (_, record) => {
        const level = MESSAGE_LEVELS[record.level ?? ''];
        return level ? <Tag color={level.status}>{level.text}</Tag> : '-';
      },
    },
    {
      title: '业务',
      dataIndex: 'bizTitle',
      width: 160,
      search: false,
      render: (_, record) =>
        record.bizTitle ? (
          <span>
            {record.bizType ? `[${record.bizType}] ` : ''}
            {record.bizTitle}
          </span>
        ) : (
          '-'
        ),
    },
    {
      title: '发送人',
      dataIndex: 'senderId',
      width: 110,
      search: false,
      render: (_, record) =>
        record.senderType === 'SYSTEM' ? '系统' : ownerName(record.senderId),
    },
    {
      title: '时间',
      dataIndex: 'createTime',
      width: 170,
      search: false,
    },
    {
      title: '状态',
      dataIndex: 'read',
      width: 90,
      valueType: 'select',
      valueEnum: {
        false: { text: '未读', status: 'Warning' },
        true: { text: '已读', status: 'Default' },
      },
      render: (_, record) =>
        record.read ? <Tag>已读</Tag> : <Tag color="warning">未读</Tag>,
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
            title="查看详情"
            icon={<EyeOutlined />}
            onClick={() => record.id && openDetail(record.id)}
          />
          {record.read ? null : (
            <ActionButton
              key="read"
              title="标记已读"
              icon={<CheckOutlined />}
              onClick={() => record.id && readMutation.mutateAsync(record.id)}
            />
          )}
          <Popconfirm
            key="delete"
            title="确认删除该消息？"
            onConfirm={() => record.id && deleteMutation.mutateAsync(record.id)}
          >
            <ActionButton title="删除" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title={
        <Badge
          count={unreadQuery.data ?? 0}
          offset={[10, 0]}
          size="small"
          overflowCount={99}
        >
          站内信
        </Badge>
      }
    >
      {contextHolder}
      <ProTable<Crm.MessageDto>
        headerTitle={`我的消息（未读 ${unreadQuery.data ?? 0}）`}
        actionRef={actionRef}
        rowKey="id"
        scroll={{ x: 'max-content' }}
        search={{ labelWidth: 'auto' }}
        toolBarRender={() => [
          <Button
            key="read-all"
            onClick={() => readAllMutation.mutateAsync({})}
          >
            全部标记已读
          </Button>,
          <Button
            key="send"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setSendOpen(true)}
          >
            发送消息
          </Button>,
        ]}
        request={async (params) => {
          const { current = 1, pageSize = 10, ...rest } = params;
          const res = await listMessages({
            page: current,
            size: pageSize,
            read:
              rest.read === undefined
                ? undefined
                : rest.read === true || rest.read === 'true',
            messageType: rest.messageType as string | undefined,
            level: rest.level as string | undefined,
          });
          return toTableResult<Crm.MessageDto>(res);
        }}
        columns={columns}
      />

      <Drawer
        title="消息详情"
        size={640}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      >
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="标题">
            {detail?.title ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="类型">
            {MESSAGE_TYPES.find((item) => item.value === detail?.messageType)
              ?.label ??
              detail?.messageType ??
              '-'}
          </Descriptions.Item>
          <Descriptions.Item label="级别">
            {MESSAGE_LEVELS[detail?.level ?? '']?.text ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="发送人">
            {detail?.senderType === 'SYSTEM'
              ? '系统'
              : ownerName(detail?.senderId)}
          </Descriptions.Item>
          <Descriptions.Item label="业务">
            {detail?.bizTitle ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="时间">
            {detail?.createTime ?? '-'}
          </Descriptions.Item>
          <Descriptions.Item label="内容">
            {detail?.content ?? '-'}
          </Descriptions.Item>
        </Descriptions>
      </Drawer>

      <ModalForm
        title="发送人工消息"
        open={sendOpen}
        onOpenChange={setSendOpen}
        width={600}
        modalProps={{ destroyOnClose: true }}
        onFinish={async (values) => {
          try {
            await sendMutation.mutateAsync(values as Crm.MessageSendRequest);
            return true;
          } catch {
            return false;
          }
        }}
      >
        <ProFormSelect
          name="receiverId"
          label="收件人"
          options={ownerOptions}
          rules={[{ required: true, message: '请选择收件人' }]}
        />
        <ProFormText
          name="title"
          label="标题"
          rules={[{ required: true, message: '请输入标题' }]}
        />
        <ProFormTextArea
          name="content"
          label="内容"
          fieldProps={{ rows: 6 }}
          rules={[{ required: true, message: '请输入内容' }]}
        />
      </ModalForm>
    </PageContainer>
  );
};

export default MessageCenter;
