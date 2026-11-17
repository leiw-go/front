/**
 * 邮件引擎的流式客户端。
 *
 * 后端 `POST /api/crm/email-engine/rewrite` 返回 `text/event-stream`，
 * 事件协议（不是 OpenAI 帧，是后端为业务定的）：
 *
 * ```
 * event: meta
 * data: {"requestId":"...","model":"minimax-cn:MiniMax-M3.1-Flash","language":"en",...}
 *
 * event: reasoning
 * data: {"thinking":"模型的思考过程..."}
 *
 * event: delta
 * data: {"content":"改写后的正文增量"}
 *
 * event: done
 * data: {"requestId":"...","finishReason":"stop","elapsedMs":8439,"usage":{...}}
 *
 * event: error
 * data: {"code":"upstream_error","message":"..."}
 * ```
 *
 * 刻意不走 umi 的 `request`：它不支持读取流式响应体。
 */

export interface EmailEngineMeta {
  requestId?: string;
  model?: string;
  language?: string;
  languageLabel?: string;
  tone?: string;
  toneLabel?: string;
  scene?: string;
  sceneLabel?: string;
  /** 本次实际发送的系统提示（后端回传，便于核对改写依据）. */
  systemPrompt?: string;
  /** 本次实际发送的用户提示（后端回传）. */
  userPrompt?: string;
}

export interface EmailEngineUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface EmailEngineDone {
  requestId?: string;
  finishReason?: string;
  elapsedMs?: number;
  /** 主题（后端从模型输出里拆出来的）. */
  subject?: string;
  /** 正文（后端从模型输出里拆出来的）. */
  body?: string;
  usage?: EmailEngineUsage;
}

export interface EmailEngineHandlers {
  /** 首帧：本次调用的模型 / 语言 / 语气 / 场景. */
  onMeta?: (meta: EmailEngineMeta) => void;
  /** 推理型模型的思考过程增量（可折叠展示，不进正文）. */
  onReasoning?: (text: string) => void;
  /** 正文增量. */
  onDelta?: (text: string) => void;
  /** 末帧：结束原因 / 耗时 / token 用量. */
  onDone?: (done: EmailEngineDone) => void;
  /** 出错. */
  onError?: (error: { code?: string; message: string }) => void;
}

/** 帧分隔符（SSE 允许 \n\n 或 \r\n\r\n）. */
const FRAME_SEPARATOR = /\r?\n\r?\n/;

/** 拆出来的邮件输出. */
export interface EmailEngineOutput {
  /** 主题（模型没写主题行时为空）. */
  subject: string;
  /** 正文. */
  body: string;
}

/**
 * 把模型输出拆成主题与正文。
 *
 * prompt 规定首行是 `Subject: <主题>`，空一行后是正文。这里做同样的容错：
 * 没有主题行时整段都当正文（宁可少一个标题，也不丢内容）。
 *
 * @param raw 模型输出的完整文本
 */
export function parseEmailOutput(raw: string): EmailEngineOutput {
  if (!raw?.trim()) return { subject: '', body: '' };
  const normalized = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  let first = 0;
  while (first < lines.length && !lines[first].trim()) first += 1;
  if (first >= lines.length) return { subject: '', body: '' };
  const head = lines[first].trim();
  if (!head.toLowerCase().startsWith('subject:')) {
    return { subject: '', body: normalized.trim() };
  }
  const subject = head.slice('subject:'.length).trim();
  let bodyStart = first + 1;
  if (bodyStart < lines.length && !lines[bodyStart].trim()) bodyStart += 1;
  return { subject, body: lines.slice(bodyStart).join('\n').trim() };
}

/** 单帧解析：抽出事件名与数据. */
export function parseFrame(frame: string): {
  event: string;
  data: string;
} | null {
  let event = 'message';
  const dataLines: string[] = [];
  for (const line of frame.split(/\r?\n/)) {
    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trim());
    }
  }
  if (!dataLines.length) return null;
  return { event, data: dataLines.join('\n') };
}

/** 把一帧派发到 handlers. */
export function dispatchFrame(frame: string, handlers: EmailEngineHandlers) {
  const parsed = parseFrame(frame);
  if (!parsed) return;
  let payload: Record<string, any>;
  try {
    payload = JSON.parse(parsed.data);
  } catch {
    // 不是 JSON 的帧（例如心跳）直接忽略
    return;
  }
  switch (parsed.event) {
    case 'meta':
      handlers.onMeta?.(payload as EmailEngineMeta);
      break;
    case 'reasoning':
      handlers.onReasoning?.(payload.thinking ?? '');
      break;
    case 'delta':
      handlers.onDelta?.(payload.content ?? '');
      break;
    case 'done':
      handlers.onDone?.(payload as EmailEngineDone);
      break;
    case 'error':
      handlers.onError?.({
        code: payload.code,
        message: payload.message ?? '改写失败',
      });
      break;
    default:
      break;
  }
}

/**
 * 调用后端改写接口并流式接收结果。
 *
 * @param body     改写参数
 * @param handlers 事件回调
 * @param signal   中断信号（点「停止」时 abort）
 */
export async function streamEmailRewrite(
  body: Crm.CrmEmailEngineRewriteRequest,
  handlers: EmailEngineHandlers,
  signal?: AbortSignal,
) {
  const token = localStorage.getItem('token');
  let response: Response;
  try {
    response = await fetch('/api/crm/email-engine/rewrite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') return;
    handlers.onError?.({
      message: (error as Error)?.message ?? '网络请求失败',
    });
    return;
  }

  if (!response.ok) {
    let message = `请求失败（${response.status}）`;
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch {
      // 响应体不是 JSON，用默认文案
    }
    handlers.onError?.({ message });
    return;
  }

  if (!response.body) {
    handlers.onError?.({ message: '当前浏览器不支持流式响应' });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let match = FRAME_SEPARATOR.exec(buffer);
      while (match) {
        dispatchFrame(buffer.slice(0, match.index), handlers);
        buffer = buffer.slice(match.index + match[0].length);
        match = FRAME_SEPARATOR.exec(buffer);
      }
    }
    // 收尾：最后一段可能没有以空行结束
    if (buffer.trim()) {
      dispatchFrame(buffer, handlers);
    }
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') return;
    handlers.onError?.({
      message: (error as Error)?.message ?? '流式读取中断',
    });
  }
}
