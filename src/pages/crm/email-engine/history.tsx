import {
  CopyOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SnippetsOutlined,
} from '@ant-design/icons';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  Button,
  Card,
  Descriptions,
  Drawer,
  Empty,
  message,
  Popconfirm,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import {
  deleteEmailGenerationHistory,
  emailEngineOptions,
  listEmailGenerationHistory,
} from '@/services/crm/crmEmailEngine';
import { HighlightedText } from './highlight';

/** 每页条数. */
const PAGE_SIZE = 20;

/** 历史卡片与详情抽屉的属性. */
export interface EmailGenerationHistoryProps {
  /** 把这条历史填回草稿（拿上一版继续改）. */
  onUseAsDraft?: (item: Crm.CrmEmailGenerationDto) => void;
}

/**
 * 邮件生成历史卡片.
 *
 * 每次生成成功的邮件都存进了后端，这里按时间倒排展示 ——
 * 可以回看当时用了什么参数，也可以把上一版拿回来接着改。
 */
const EmailGenerationHistory: React.FC<EmailGenerationHistoryProps> = ({
  onUseAsDraft,
}) => {
  const [messageApi, contextHolder] = message.useMessage();
  const queryClient = useQueryClient();
  const [detail, setDetail] = useState<Crm.CrmEmailGenerationDto>();

  const historyQuery = useInfiniteQuery({
    queryKey: ['crm', 'email-engine', 'history'],
    queryFn: async ({ pageParam }) => {
      const res = await listEmailGenerationHistory({
        page: pageParam,
        size: PAGE_SIZE,
      });
      return res?.data;
    },
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const rows = last?.data?.length ?? 0;
      const total = last?.total ?? 0;
      const page = last?.page ?? 1;
      return rows > 0 && page * PAGE_SIZE < total ? page + 1 : undefined;
    },
  });

  // 语言 / 语气 / 场景的展示名 —— 与页面顶部的 options 共用同一份缓存
  const optionsQuery = useQuery({
    queryKey: ['crm', 'email-engine', 'options'],
    queryFn: async () => {
      const res = await emailEngineOptions();
      return res?.data;
    },
  });

  const labels = useMemo(() => {
    const toMap = (items?: { code?: string; label?: string }[]) =>
      new Map(
        (items ?? [])
          .filter(
            (item): item is { code: string; label?: string } => !!item.code,
          )
          .map((item) => [item.code, item.label ?? item.code]),
      );
    return {
      language: toMap(optionsQuery.data?.languages),
      tone: toMap(optionsQuery.data?.tones),
      scene: toMap(optionsQuery.data?.scenes),
    };
  }, [optionsQuery.data]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEmailGenerationHistory({ id }),
    onSuccess: () => {
      messageApi.success('已删除');
      setDetail(undefined);
      queryClient.invalidateQueries({
        queryKey: ['crm', 'email-engine', 'history'],
      });
    },
    onError: () => {
      messageApi.error('删除失败');
    },
  });

  const rows =
    historyQuery.data?.pages.flatMap((page) => page?.data ?? []) ?? [];

  /** 复制一封历史邮件（主题 + 正文）. */
  const copyItem = async (item: Crm.CrmEmailGenerationDto) => {
    const text = item.subject
      ? `Subject: ${item.subject}\n\n${item.content ?? ''}`
      : (item.content ?? '');
    try {
      await navigator.clipboard.writeText(text);
      messageApi.success('已复制到剪贴板');
    } catch {
      messageApi.error('复制失败，请手动选中复制');
    }
  };

  return (
    <>
      {contextHolder}
      <Card
        variant="borderless"
        title="生成历史"
        extra={
          <Tooltip title="刷新">
            <Button
              type="text"
              icon={<ReloadOutlined />}
              loading={historyQuery.isFetching}
              onClick={() => historyQuery.refetch()}
            />
          </Tooltip>
        }
      >
        {historyQuery.isLoading ? (
          <Typography.Text type="secondary">加载中……</Typography.Text>
        ) : rows.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="还没有生成记录"
            style={{ margin: '12px 0' }}
          />
        ) : (
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {rows.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: '8px 0',
                  borderBottom: '1px solid #f0f0f0',
                }}
              >
                <Space direction="vertical" size={2} style={{ width: '100%' }}>
                  <Space size={4} wrap>
                    <Typography.Text
                      strong
                      ellipsis
                      style={{ maxWidth: 280, marginBottom: 0 }}
                    >
                      {item.subject || '（无主题）'}
                    </Typography.Text>
                    {item.language ? (
                      <Tag>
                        {labels.language.get(item.language) ?? item.language}
                      </Tag>
                    ) : null}
                    {item.tone ? (
                      <Tag color="blue">
                        {labels.tone.get(item.tone) ?? item.tone}
                      </Tag>
                    ) : null}
                    {item.scene ? (
                      <Tag color="default">
                        {labels.scene.get(item.scene) ?? item.scene}
                      </Tag>
                    ) : null}
                  </Space>
                  <Space size={4} wrap>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {item.createTime
                        ? dayjs(item.createTime).format('YYYY-MM-DD HH:mm')
                        : '-'}
                    </Typography.Text>
                    <Button
                      type="link"
                      size="small"
                      onClick={() => setDetail(item)}
                    >
                      查看
                    </Button>
                    <Button
                      type="link"
                      size="small"
                      icon={<CopyOutlined />}
                      onClick={() => copyItem(item)}
                    >
                      复制
                    </Button>
                    {onUseAsDraft ? (
                      <Button
                        type="link"
                        size="small"
                        icon={<SnippetsOutlined />}
                        onClick={() => onUseAsDraft(item)}
                      >
                        粘回草稿
                      </Button>
                    ) : null}
                    <Popconfirm
                      title="删除这条生成记录？"
                      okText="删除"
                      cancelText="取消"
                      onConfirm={() =>
                        item.id && deleteMutation.mutate(item.id)
                      }
                    >
                      <Button
                        type="link"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                      />
                    </Popconfirm>
                  </Space>
                </Space>
              </div>
            ))}
            {historyQuery.hasNextPage ? (
              <Button
                block
                type="link"
                loading={historyQuery.isFetchingNextPage}
                onClick={() => historyQuery.fetchNextPage()}
              >
                加载更多
              </Button>
            ) : null}
          </div>
        )}
      </Card>

      <Drawer
        title="生成详情"
        width={720}
        open={!!detail}
        onClose={() => setDetail(undefined)}
        extra={
          <Space>
            <Button
              icon={<CopyOutlined />}
              onClick={() => detail && copyItem(detail)}
            >
              复制
            </Button>
            {onUseAsDraft && detail ? (
              <Button
                icon={<SnippetsOutlined />}
                onClick={() => {
                  onUseAsDraft(detail);
                  setDetail(undefined);
                }}
              >
                粘回草稿
              </Button>
            ) : null}
          </Space>
        }
      >
        {detail ? (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="主题">
                {detail.subject || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="生成时间">
                {detail.createTime
                  ? dayjs(detail.createTime).format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="语言 / 语气 / 场景">
                <Space size={4} wrap>
                  <Tag>
                    {labels.language.get(detail.language ?? '') ??
                      detail.language ??
                      '-'}
                  </Tag>
                  <Tag color="blue">
                    {labels.tone.get(detail.tone ?? '') ?? detail.tone ?? '-'}
                  </Tag>
                  <Tag>
                    {labels.scene.get(detail.scene ?? '') ??
                      detail.scene ??
                      '-'}
                  </Tag>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="模型">
                {detail.model || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="耗时 / Token">
                {detail.elapsedMs ? `${detail.elapsedMs} ms` : '-'} /{' '}
                {detail.totalTokens ?? 0}
              </Descriptions.Item>
              {detail.customInstruction ? (
                <Descriptions.Item label="特殊场景与要求">
                  {detail.customInstruction}
                </Descriptions.Item>
              ) : null}
              {detail.sourceContent ? (
                <Descriptions.Item label="输入的草稿">
                  <Typography.Text
                    type="secondary"
                    style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}
                  >
                    {detail.sourceContent}
                  </Typography.Text>
                </Descriptions.Item>
              ) : null}
            </Descriptions>

            <Typography.Text type="secondary" style={{ marginTop: 16 }}>
              正文
            </Typography.Text>
            <div
              style={{
                marginTop: 4,
                padding: 16,
                borderRadius: 8,
                background: '#fafafa',
                border: '1px solid #f0f0f0',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                fontSize: 13,
                lineHeight: 1.7,
              }}
            >
              <HighlightedText text={detail.content} />
            </div>
          </>
        ) : null}
      </Drawer>
    </>
  );
};

export default EmailGenerationHistory;
