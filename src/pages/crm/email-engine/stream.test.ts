import { describe, expect, it, vi } from 'vitest';
import {
  dispatchFrame,
  parseEmailOutput,
  parseFrame,
  streamEmailRewrite,
} from './stream';

/** 造一个假的 SSE 响应体 */
function fakeStream(chunks: string[]) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      chunks.forEach((chunk) => {
        controller.enqueue(encoder.encode(chunk));
      });
      controller.close();
    },
  });
}

function mockFetch(body: ReadableStream, ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    body,
    json: async () => ({ message: 'boom' }),
  });
}

describe('parseFrame', () => {
  it('拆出事件名与数据', () => {
    const parsed = parseFrame('event: delta\ndata: {"content":"hi"}');
    expect(parsed?.event).toBe('delta');
    expect(parsed?.data).toBe('{"content":"hi"}');
  });

  it('没有 event 行时默认 message', () => {
    const parsed = parseFrame('data: {"content":"hi"}');
    expect(parsed?.event).toBe('message');
  });

  it('没有 data 行时返回 null', () => {
    expect(parseFrame('event: ping')).toBeNull();
  });
});

describe('dispatchFrame', () => {
  it('meta 帧走 onMeta', () => {
    const onMeta = vi.fn();
    dispatchFrame('event: meta\ndata: {"model":"m1","language":"en"}', {
      onMeta,
    });
    expect(onMeta).toHaveBeenCalledWith({ model: 'm1', language: 'en' });
  });

  it('reasoning 帧取 thinking 字段，不进正文', () => {
    const onReasoning = vi.fn();
    const onDelta = vi.fn();
    dispatchFrame('event: reasoning\ndata: {"thinking":"想一下"}', {
      onReasoning,
      onDelta,
    });
    expect(onReasoning).toHaveBeenCalledWith('想一下');
    expect(onDelta).not.toHaveBeenCalled();
  });

  it('delta 帧取 content 字段', () => {
    const onDelta = vi.fn();
    dispatchFrame('event: delta\ndata: {"content":"正文"}', { onDelta });
    expect(onDelta).toHaveBeenCalledWith('正文');
  });

  it('done 帧带用量', () => {
    const onDone = vi.fn();
    dispatchFrame(
      'event: done\ndata: {"finishReason":"stop","usage":{"totalTokens":42}}',
      { onDone },
    );
    expect(onDone).toHaveBeenCalledWith({
      finishReason: 'stop',
      usage: { totalTokens: 42 },
    });
  });

  it('error 帧带上 code 与 message', () => {
    const onError = vi.fn();
    dispatchFrame(
      'event: error\ndata: {"code":"upstream_error","message":"挂了"}',
      {
        onError,
      },
    );
    expect(onError).toHaveBeenCalledWith({
      code: 'upstream_error',
      message: '挂了',
    });
  });

  it('非法 JSON 的帧被忽略', () => {
    const onDelta = vi.fn();
    dispatchFrame('event: delta\ndata: not-json', { onDelta });
    expect(onDelta).not.toHaveBeenCalled();
  });
});

describe('parseEmailOutput', () => {
  it('拆出主题与正文', () => {
    const parsed = parseEmailOutput(
      'Subject: Quotation for LED strip\n\nDear Mr. Smith,\nCould you please help me?',
    );
    expect(parsed.subject).toBe('Quotation for LED strip');
    expect(parsed.body).toBe('Dear Mr. Smith,\nCould you please help me?');
  });

  it('没有主题行时整段当正文', () => {
    const parsed = parseEmailOutput(
      'Dear Mr. Smith,\nCould you please help me?',
    );
    expect(parsed.subject).toBe('');
    expect(parsed.body).toBe('Dear Mr. Smith,\nCould you please help me?');
  });

  it('主题行大小写不敏感', () => {
    expect(parseEmailOutput('SUBJECT: Hello\n\nBody').subject).toBe('Hello');
  });

  it('空输出返回空主题空正文', () => {
    expect(parseEmailOutput('   ')).toEqual({ subject: '', body: '' });
  });
});

describe('streamEmailRewrite', () => {
  it('按帧顺序派发事件', async () => {
    const body = fakeStream([
      'event: meta\ndata: {"model":"m1"}\n\n',
      'event: delta\ndata: {"content":"你"}\n\n',
      'event: delta\ndata: {"content":"好"}\n\n',
      'event: done\ndata: {"finishReason":"stop"}\n\n',
    ]);
    const fetchMock = mockFetch(body);
    vi.stubGlobal('fetch', fetchMock);

    const deltas: string[] = [];
    let meta: unknown;
    let finished: unknown;
    await streamEmailRewrite(
      { content: 'x' },
      {
        onMeta: (m) => {
          meta = m;
        },
        onDelta: (t) => deltas.push(t),
        onDone: (d) => {
          finished = d;
        },
      },
    );

    expect(meta).toEqual({ model: 'm1' });
    expect(deltas.join('')).toBe('你好');
    expect(finished).toEqual({ finishReason: 'stop' });
    vi.unstubAllGlobals();
  });

  it('跨 chunk 边界的一帧也能正确解析', async () => {
    const body = fakeStream(['event: delta\ndata: {"cont', 'ent":"跨块"}\n\n']);
    vi.stubGlobal('fetch', mockFetch(body));

    const deltas: string[] = [];
    await streamEmailRewrite(
      { content: 'x' },
      { onDelta: (t) => deltas.push(t) },
    );

    expect(deltas.join('')).toBe('跨块');
    vi.unstubAllGlobals();
  });

  it('响应不是 ok 时回调错误', async () => {
    const body = fakeStream([]);
    vi.stubGlobal('fetch', mockFetch(body, false, 400));

    const onError = vi.fn();
    await streamEmailRewrite({ content: 'x' }, { onError });

    expect(onError).toHaveBeenCalledWith({ message: 'boom' });
    vi.unstubAllGlobals();
  });

  it('请求带 Authorization 头', async () => {
    localStorage.setItem('token', 'jwt-123');
    const body = fakeStream([]);
    const fetchMock = mockFetch(body);
    vi.stubGlobal('fetch', fetchMock);

    await streamEmailRewrite({ content: 'x' }, {});

    const [, init] = fetchMock.mock.calls[0] as any;
    expect(init.headers.Authorization).toBe('Bearer jwt-123');
    expect(init.headers.Accept).toBe('text/event-stream');
    vi.unstubAllGlobals();
  });
});
