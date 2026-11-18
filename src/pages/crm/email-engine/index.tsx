import {
  ClearOutlined,
  CopyOutlined,
  DownloadOutlined,
  SaveOutlined,
  SnippetsOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { history } from '@umijs/max';
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Descriptions,
  Divider,
  Form,
  Input,
  Modal,
  message,
  Row,
  Segmented,
  Select,
  Space,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  emailEngineOptions,
  saveEmailEngineTemplate,
} from '@/services/crm/crmEmailEngine';
import { HighlightedText, HighlightedTextArea } from './highlight';
import EmailGenerationHistory from './history';
import {
  type EmailEngineDone,
  type EmailEngineMeta,
  parseEmailOutput,
  streamEmailRewrite,
} from './stream';

interface FormValues {
  content?: string;
  subject?: string;
  language?: string;
  tone?: string;
  scene?: string;
  customInstruction?: string;
  model?: string;
  customerName?: string;
  senderName?: string;
  senderCompany?: string;
  senderTitle?: string;
}

const MAX_CONTENT = 8000;

/** 语气兜底标签（接口没回来时也能显示） */
const TONE_LABELS: Record<string, string> = {
  new_customer: '新客户语气',
  existing_customer: '老客户语气',
};

const QuotationEmailEngine: React.FC = () => {
  const [form] = Form.useForm<FormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const queryClient = useQueryClient();
  const abortRef = useRef<AbortController | null>(null);

  const [streaming, setStreaming] = useState(false);
  const [result, setResult] = useState('');
  const [thinking, setThinking] = useState('');
  const [meta, setMeta] = useState<EmailEngineMeta>();
  const [done, setDone] = useState<EmailEngineDone>();
  const [error, setError] = useState<string>();
  const [saveOpen, setSaveOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const optionsQuery = useQuery({
    queryKey: ['crm', 'email-engine', 'options'],
    queryFn: async () => {
      const res = await emailEngineOptions();
      return res?.data;
    },
  });

  const options = optionsQuery.data;

  const languageOptions = useMemo(
    () =>
      (options?.languages ?? []).map((item) => ({
        label: item.label,
        value: item.code,
      })),
    [options?.languages],
  );

  const sceneOptions = useMemo(
    () =>
      (options?.scenes ?? []).map((item) => ({
        label: item.label,
        value: item.code,
        hint: item.hint,
      })),
    [options?.scenes],
  );

  const modelOptions = useMemo(
    () =>
      (options?.models ?? []).map((item) => ({
        label: item.label,
        value: item.code,
      })),
    [options?.models],
  );

  const toneOptions = useMemo(
    () =>
      (options?.tones ?? []).map((item) => ({
        label: item.label,
        value: item.code,
        hint: item.hint,
      })),
    [options?.tones],
  );

  /** 草稿内容 —— 有内容走微调，没有内容直接生成. */
  const draftContent = Form.useWatch('content', form);
  const mode: 'rewrite' | 'generate' = draftContent?.trim()
    ? 'rewrite'
    : 'generate';

  /** 拆出来的主题与正文（流式过程中也会实时拆）. */
  const parsed = useMemo(() => parseEmailOutput(result), [result]);

  /** 主题 + 正文拼成一段可复制的文本. */
  const composeOutput = useCallback(() => {
    if (!parsed.subject) return parsed.body;
    return `Subject: ${parsed.subject}\n\n${parsed.body}`;
  }, [parsed]);

  /** 把生成结果粘回草稿 —— 拿上一轮的结果做下一轮的微调 */
  const pasteResultToDraft = useCallback(() => {
    if (!result.trim()) {
      messageApi.warning('还没有生成结果');
      return;
    }
    const body = parsed.body || result;
    if (body.length > MAX_CONTENT) {
      form.setFieldValue('content', body.slice(0, MAX_CONTENT));
      messageApi.warning(`生成结果超过 ${MAX_CONTENT} 字，已截断`);
    } else {
      form.setFieldValue('content', body);
    }
    // 模型没输出主题行时保留原来的主题，不覆盖成空
    if (parsed.subject) {
      form.setFieldValue('subject', parsed.subject);
    }
    messageApi.success('已把生成结果填入草稿，可继续微调');
  }, [form, messageApi, parsed, result]);

  /** 清除草稿（连同草稿里的原始主题） */
  const clearDraft = useCallback(() => {
    form.setFieldValue('content', '');
    form.setFieldValue('subject', '');
  }, [form]);

  /** 把一条历史邮件填回草稿 —— 拿上一版接着改 */
  const useHistoryAsDraft = useCallback(
    (item: Crm.CrmEmailGenerationDto) => {
      form.setFieldValue('content', item.content ?? '');
      form.setFieldValue('subject', item.subject ?? '');
      messageApi.success('已填入草稿，可继续微调');
    },
    [form, messageApi],
  );

  /** 开始改写（流式）：有草稿 = 微调，没有草稿 = 直接生成 */
  const startRewrite = useCallback(async () => {
    let values: FormValues;
    try {
      values = await form.validateFields();
    } catch {
      // 校验没过，antd 已在字段上标红
      return;
    }
    const hasDraft = !!values.content?.trim();
    const hasInstruction = !!values.customInstruction?.trim();
    if (!hasDraft && !hasInstruction) {
      messageApi.warning('请填写草稿内容，或说明特殊场景与要求');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStreaming(true);
    setResult('');
    setThinking('');
    setMeta(undefined);
    setDone(undefined);
    setError(undefined);

    await streamEmailRewrite(
      {
        content: values.content,
        subject: values.subject,
        language: values.language,
        tone: values.tone,
        scene: values.scene,
        customInstruction: values.customInstruction,
        model: values.model,
        customerName: values.customerName,
        senderName: values.senderName,
        senderCompany: values.senderCompany,
        senderTitle: values.senderTitle,
      },
      {
        onMeta: (payload) => setMeta(payload),
        onReasoning: (text) => setThinking((prev) => prev + text),
        onDelta: (text) => setResult((prev) => prev + text),
        onDone: (payload) => {
          setDone(payload);
          // 后端已把这封邮件存进生成历史 —— 刷新列表
          queryClient.invalidateQueries({
            queryKey: ['crm', 'email-engine', 'history'],
          });
        },
        onError: (err) => setError(err.message),
      },
      controller.signal,
    );

    setStreaming(false);
    abortRef.current = null;
  }, [form, messageApi, queryClient]);

  /** 停止（中断流） */
  const stopRewrite = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
    messageApi.info('已停止');
  };

  /** 清空 */
  const resetAll = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    form.resetFields();
    setResult('');
    setThinking('');
    setMeta(undefined);
    setDone(undefined);
    setError(undefined);
    setStreaming(false);
  };

  /** 复制结果（主题 + 正文） */
  const copyResult = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(composeOutput());
      messageApi.success('已复制到剪贴板');
    } catch {
      messageApi.error('复制失败，请手动选中复制');
    }
  };

  /** 下载为 txt */
  const downloadResult = () => {
    if (!result) return;
    const blob = new Blob([composeOutput()], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `email-${meta?.language ?? 'draft'}-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  /** 保存为邮件模板 */
  const saveAsTemplate = async () => {
    if (!templateName.trim()) {
      messageApi.warning('请填写模板名');
      return;
    }
    const values = form.getFieldsValue();
    try {
      const res = await saveEmailEngineTemplate({
        name: templateName.trim(),
        subject: parsed.subject || values.subject || '',
        content: composeOutput(),
        language: values.language ?? 'en',
        templateType: values.scene ?? 'inquiry_reply',
      });
      if (res?.code === 200) {
        messageApi.success('已保存为邮件模板');
        setSaveOpen(false);
        setTemplateName('');
      } else {
        messageApi.error(res?.message ?? '保存失败');
      }
    } catch {
      messageApi.error('保存失败');
    }
  };

  const usage = done?.usage;

  return (
    <PageContainer
      title="邮件引擎"
      subTitle="用 AI 把基础邮件改写成专业、地道、对应目标语言的商务邮件"
    >
      {contextHolder}
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          language: 'en',
          tone: 'new_customer',
          scene: 'inquiry_reply',
          senderName: 'leon',
          senderTitle: '销售业务员',
        }}
        disabled={streaming}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={9}>
            <Card
              variant="borderless"
              title={mode === 'rewrite' ? '草稿（微调）' : '草稿（可留空）'}
              extra={
                <Space size={4}>
                  <Tooltip title="把生成结果粘回草稿，继续微调">
                    <Button
                      type="text"
                      icon={<SnippetsOutlined />}
                      disabled={streaming || !result}
                      onClick={pasteResultToDraft}
                    />
                  </Tooltip>
                  <Tooltip title="清除草稿">
                    <Button
                      type="text"
                      icon={<ClearOutlined />}
                      disabled={streaming || !draftContent}
                      onClick={clearDraft}
                    />
                  </Tooltip>
                </Space>
              }
            >
              <Alert
                type="info"
                showIcon
                style={{ marginBottom: 12 }}
                message={
                  mode === 'rewrite'
                    ? '已填草稿 —— AI 会在草稿基础上微调，事实信息一律保留。'
                    : '没有草稿 —— AI 会按下面的场景与特殊要求直接生成一封新邮件。'
                }
              />
              <Form.Item
                name="content"
                label="草稿内容"
                extra="可以粘客户来信，也可以粘上一轮的改进结果；[型号] 这类占位符会标红"
                rules={[
                  {
                    validator: (_, value) =>
                      !value || value.length <= MAX_CONTENT
                        ? Promise.resolve()
                        : Promise.reject(
                            new Error(`内容不能超过 ${MAX_CONTENT} 字`),
                          ),
                  },
                ]}
              >
                <HighlightedTextArea
                  rows={8}
                  maxLength={MAX_CONTENT}
                  disabled={streaming}
                  placeholder="把客户来信或你写好的草稿粘贴到这里……"
                />
              </Form.Item>
              <Form.Item name="subject" label="草稿里的原始主题（可选）">
                <Input placeholder="例如 LED strip inquiry" />
              </Form.Item>
            </Card>

            <Card
              variant="borderless"
              title="改写参数"
              style={{ marginTop: 16 }}
            >
              <Form.Item
                name="customInstruction"
                label="特殊场景与要求"
                extra="比「业务场景」优先 —— 例如「客户展会后要跟进，强调交期」「报价不要写死，等我确认」
                "
              >
                <Input.TextArea
                  rows={3}
                  maxLength={500}
                  placeholder="这次想达到什么效果？有什么特别的要求？"
                />
              </Form.Item>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="language" label="目标语言">
                    <Select
                      options={languageOptions}
                      loading={optionsQuery.isLoading}
                      placeholder="英语"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="scene" label="业务场景">
                    <Select
                      options={sceneOptions}
                      loading={optionsQuery.isLoading}
                      placeholder="询盘回复"
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                name="tone"
                label="语气"
                tooltip={
                  toneOptions.find((item) => item.value === 'new_customer')
                    ?.hint ?? '新客户语气 = 非常客气礼貌；老客户语气 = 随和亲近'
                }
              >
                <Segmented
                  block
                  options={toneOptions.map((item) => ({
                    label: item.label,
                    value: item.value,
                  }))}
                />
              </Form.Item>
              <Form.Item name="model" label="模型">
                <Select
                  options={modelOptions}
                  loading={optionsQuery.isLoading}
                  placeholder={options?.defaultModel}
                />
              </Form.Item>
              <Divider style={{ margin: '4px 0 12px' }} />
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="customerName" label="客户（决定称呼）">
                    <Input placeholder="Acme Trading Co." />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="senderName" label="我方联系人">
                    <Input placeholder="leon" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="senderCompany" label="我方公司">
                    <Input placeholder="GreatBus" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="senderTitle" label="我方职位">
                    <Input placeholder="销售业务员" />
                  </Form.Item>
                </Col>
              </Row>
              <Space>
                <Button
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  loading={streaming}
                  onClick={startRewrite}
                >
                  {mode === 'rewrite' ? '微调改进' : '生成邮件'}
                </Button>
                {streaming ? <Button onClick={stopRewrite}>停止</Button> : null}
                <Button icon={<ClearOutlined />} onClick={resetAll}>
                  清空
                </Button>
              </Space>
            </Card>
          </Col>

          <Col xs={24} xl={15}>
            <Card
              variant="borderless"
              title={mode === 'rewrite' ? '微调结果' : '生成结果'}
              extra={
                <Space size={4}>
                  <Button
                    type="text"
                    icon={<CopyOutlined />}
                    disabled={!result}
                    onClick={copyResult}
                  >
                    复制
                  </Button>
                  <Button
                    type="text"
                    icon={<DownloadOutlined />}
                    disabled={!result}
                    onClick={downloadResult}
                  >
                    下载
                  </Button>
                  <Button
                    type="text"
                    icon={<SaveOutlined />}
                    disabled={!result || streaming}
                    onClick={() => setSaveOpen(true)}
                  >
                    存为模板
                  </Button>
                </Space>
              }
            >
              {error ? (
                <Alert
                  type="error"
                  showIcon
                  style={{ marginBottom: 12 }}
                  message={mode === 'rewrite' ? '微调失败' : '生成失败'}
                  description={error}
                />
              ) : null}

              <div style={{ marginBottom: 12 }}>
                <Typography.Text type="secondary">主题</Typography.Text>
                <div
                  style={{
                    marginTop: 4,
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: '#fafafa',
                    border: '1px solid #f0f0f0',
                    fontWeight: 500,
                    wordBreak: 'break-word',
                  }}
                >
                  {parsed.subject ? (
                    <HighlightedText text={parsed.subject} />
                  ) : (
                    <Typography.Text type="secondary">
                      {streaming ? '生成中……' : '（模型没有输出主题行）'}
                    </Typography.Text>
                  )}
                </div>
              </div>

              <Typography.Text type="secondary">正文</Typography.Text>
              <div
                style={{
                  minHeight: 260,
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
                {streaming && !result ? (
                  <Typography.Text type="secondary">
                    AI 正在思考并
                    {mode === 'rewrite' ? '改写' : '撰写'}……
                  </Typography.Text>
                ) : null}
                {parsed.body ? <HighlightedText text={parsed.body} /> : null}
                {streaming ? <span style={{ opacity: 0.5 }}>▌</span> : null}
                {!result && !streaming && !error ? (
                  <Typography.Text type="secondary">
                    填好草稿（或特殊场景与要求）并设置语言 / 语气，点「
                    {mode === 'rewrite' ? '微调改进' : '生成邮件'}」。
                  </Typography.Text>
                ) : null}
              </div>

              {meta?.systemPrompt || thinking ? (
                <Collapse
                  ghost
                  style={{ marginTop: 8 }}
                  items={[
                    {
                      key: 'prompt',
                      label: '发送给 AI 的提示词',
                      children: (
                        <div style={{ fontSize: 12 }}>
                          <Typography.Text strong>system</Typography.Text>
                          <pre
                            style={{
                              margin: '4px 0 12px',
                              padding: 12,
                              background: '#f6f6f6',
                              borderRadius: 6,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              fontSize: 12,
                              lineHeight: 1.7,
                            }}
                          >
                            {meta?.systemPrompt ?? '-'}
                          </pre>
                          <Typography.Text strong>user</Typography.Text>
                          <pre
                            style={{
                              margin: '4px 0 0',
                              padding: 12,
                              background: '#f6f6f6',
                              borderRadius: 6,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              fontSize: 12,
                              lineHeight: 1.7,
                            }}
                          >
                            {meta?.userPrompt ?? '-'}
                          </pre>
                        </div>
                      ),
                    },
                    {
                      key: 'thinking',
                      label: `AI 思考过程（${thinking.length} 字）`,
                      children: (
                        <Typography.Text
                          type="secondary"
                          style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}
                        >
                          {thinking}
                        </Typography.Text>
                      ),
                    },
                  ]}
                />
              ) : null}

              {meta || done ? (
                <Descriptions
                  size="small"
                  column={{ xs: 1, sm: 2, md: 4 }}
                  style={{ marginTop: 12 }}
                  items={[
                    {
                      key: 'model',
                      label: '模型',
                      children: meta?.model ?? '-',
                    },
                    {
                      key: 'lang',
                      label: '语言 / 语气',
                      children: (
                        <Space size={4}>
                          <Tag>{meta?.languageLabel ?? '-'}</Tag>
                          <Tag color="blue">
                            {meta?.toneLabel ??
                              TONE_LABELS[meta?.tone ?? ''] ??
                              '-'}
                          </Tag>
                        </Space>
                      ),
                    },
                    {
                      key: 'elapsed',
                      label: '耗时',
                      children: done?.elapsedMs ? `${done.elapsedMs} ms` : '-',
                    },
                    {
                      key: 'usage',
                      label: 'Token 用量',
                      children: usage
                        ? `prompt ${usage.promptTokens ?? 0} / completion ${
                            usage.completionTokens ?? 0
                          } / 合计 ${usage.totalTokens ?? 0}`
                        : '-',
                    },
                  ]}
                />
              ) : null}
            </Card>

            <div style={{ marginTop: 16 }}>
              <EmailGenerationHistory onUseAsDraft={useHistoryAsDraft} />
            </div>

            <Card
              variant="borderless"
              title="改写规则"
              style={{ marginTop: 16 }}
            >
              <ul style={{ margin: 0, paddingInlineStart: 20, color: '#666' }}>
                <li>
                  有草稿走<strong>微调</strong>
                  ：型号、数量、价格、日期、贸易术语、付款方式等事实一律保留；
                  没有草稿走<strong>直接生成</strong>
                  ，此时不会编造型号与价格，缺的地方用占位或直接问客户
                </li>
                <li>两种语气都要求简洁、干练、专业，全文控制在 150 词以内</li>
                <li>
                  新客户语气：非常客气、礼貌、友好，用「Could you please help me
                  ...」这类委婉句式
                </li>
                <li>
                  老客户语气：随和、亲近、简单直接，用「Please can you
                  ...」这类轻松句式
                </li>
                <li>
                  「特殊场景与要求」优先于「业务场景」，两者都决定结构与行动指向
                </li>
                <li>
                  输出主题 + 正文，主题行在最上面，正文可直接复制进邮件客户端
                </li>
                <li>
                  模型不知道的信息会写成占位符（如 [型号]、[价格]、[Company
                  Name]），
                  <strong style={{ color: 'var(--ant-color-error, #ff4d4f)' }}>
                    标红
                  </strong>
                  提醒 —— 发之前记得填掉
                </li>
                <li>
                  想继续打磨？用草稿卡片的「粘回草稿」图标把本次结果填回草稿，
                  再改一次语气或要求 —— 草稿里的事实不会被改坏
                </li>
                <li>
                  结果可
                  <Button
                    type="link"
                    size="small"
                    onClick={() => history.push('/crm/email-manage')}
                  >
                    存为模板
                  </Button>
                  后到「邮件管理」群发
                </li>
              </ul>
            </Card>
          </Col>
        </Row>
      </Form>

      <Modal
        title="存为邮件模板"
        open={saveOpen}
        onCancel={() => setSaveOpen(false)}
        onOk={saveAsTemplate}
        okText="保存"
        cancelText="取消"
      >
        <Form layout="vertical">
          <Form.Item label="模板名" required>
            <Input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder={`AI改写-${form.getFieldValue('scene') ?? 'inquiry'}`}
            />
          </Form.Item>
          <Typography.Text type="secondary">
            保存后可在「邮件管理 → 模板」里群发。
          </Typography.Text>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default QuotationEmailEngine;
