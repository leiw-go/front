/**
 * 占位符高亮。
 *
 * 邮件引擎的 prompt 明确要求模型「不知道的地方用占位（如 [型号]、[价格]、[交期]）」，
 * 占位符没填就发出去是要出事的 —— 所以草稿和结果里都把它标红。
 *
 * 结果区是普通 DOM，直接渲染红色 span 就行；
 * 草稿区是原生 textarea（渲染不了富文本），用**镜像层**实现：
 * textarea 文字设为透明（只留光标），底下压一层同样字体/内边距的 `<pre>`，
 * 占位符用红色 span 渲染。两者宽度与滚动位置实时同步，保证换行一致。
 */

import { theme } from 'antd';
import {
  type ChangeEventHandler,
  type CSSProperties,
  Fragment,
  useCallback,
  useEffect,
  useRef,
} from 'react';

/** 占位符：[型号]、[价格]、[交期]、{Company Name}. */
const PLACEHOLDER_PATTERN = /(\[[^[\]\n]{1,40}\]|\{[^{}\n]{1,40}\})/g;

/**
 * 占位符的红色样式 —— 取 antd 的主题 token，跟着主题走.
 */
export function usePlaceholderStyle(): CSSProperties {
  const { token } = theme.useToken();
  return { color: token.colorError, fontWeight: 600 };
}

export interface TextPart {
  /** 片段文本. */
  text: string;
  /** 是否是占位符. */
  placeholder: boolean;
}

/**
 * 把文本拆成「普通片段」与「占位符片段」.
 *
 * @param text 原始文本
 * @returns 片段列表
 */
export function splitPlaceholders(text: string): TextPart[] {
  if (!text) return [];
  const parts: TextPart[] = [];
  let last = 0;
  // 每次新建正则 —— matchAll 会带上 lastIndex，复用模块级正则容易漂
  const pattern = new RegExp(PLACEHOLDER_PATTERN.source, 'g');
  for (const match of text.matchAll(pattern)) {
    const start = match.index ?? 0;
    if (start > last) {
      parts.push({ text: text.slice(last, start), placeholder: false });
    }
    parts.push({ text: match[0], placeholder: true });
    last = start + match[0].length;
  }
  if (last < text.length) {
    parts.push({ text: text.slice(last), placeholder: false });
  }
  return parts;
}

/** 文本渲染成「占位符标红」的片段. */
function renderParts(text: string, placeholderStyle: CSSProperties) {
  // key 用「文本 + 同文本出现次数」，既唯一又不用数组下标
  const seen = new Map<string, number>();
  return splitPlaceholders(text).map((part) => {
    const occurrence = seen.get(part.text) ?? 0;
    seen.set(part.text, occurrence + 1);
    const key = `${part.text}#${occurrence}`;
    return part.placeholder ? (
      <span key={key} style={placeholderStyle}>
        {part.text}
      </span>
    ) : (
      <Fragment key={key}>{part.text}</Fragment>
    );
  });
}

/**
 * 只读文本，占位符标红.
 */
export function HighlightedText({ text }: { text?: string }) {
  const placeholderStyle = usePlaceholderStyle();
  return <>{renderParts(text ?? '', placeholderStyle)}</>;
}

/** 镜像层与 textarea 共用的排版属性 —— 必须完全一致，否则换行位置会错位. */
const TEXT_STYLE: CSSProperties = {
  boxSizing: 'border-box',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 13,
  lineHeight: 1.7,
  letterSpacing: 'normal',
  tabSize: 4,
  whiteSpace: 'pre-wrap',
  overflowWrap: 'break-word',
  wordBreak: 'break-word',
  padding: '8px 12px',
  margin: 0,
  border: 'none',
  background: 'transparent',
};

export interface HighlightedTextAreaProps {
  value?: string;
  onChange?: ChangeEventHandler<HTMLTextAreaElement>;
  onBlur?: () => void;
  rows?: number;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  id?: string;
}

/**
 * 带占位符高亮的输入框.
 *
 * 用法与 antd 的 `Input.TextArea` 一样（受控 value / onChange），
 * 差别是文字由底下的镜像层渲染，因此占位符能标红。
 */
export function HighlightedTextArea({
  value = '',
  onChange,
  onBlur,
  rows = 8,
  placeholder,
  maxLength,
  disabled,
  id,
}: HighlightedTextAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLPreElement>(null);

  /**
   * 镜像层宽度 = textarea 的 clientWidth（已排除滚动条占用的宽度）——
   * 这样两边的换行位置才一致.
   */
  const syncWidth = useCallback(() => {
    const textarea = textareaRef.current;
    const mirror = mirrorRef.current;
    if (!textarea || !mirror) return;
    mirror.style.width = `${textarea.clientWidth}px`;
  }, []);

  useEffect(() => {
    const textarea = textareaRef.current;
    const mirror = mirrorRef.current;
    if (!textarea || !mirror) return;

    const syncScroll = () => {
      mirror.scrollTop = textarea.scrollTop;
      mirror.scrollLeft = textarea.scrollLeft;
    };

    syncWidth();
    syncScroll();
    textarea.addEventListener('scroll', syncScroll);

    const observer = new ResizeObserver(() => {
      syncWidth();
      syncScroll();
    });
    observer.observe(textarea);

    return () => {
      textarea.removeEventListener('scroll', syncScroll);
      observer.disconnect();
    };
  }, [syncWidth]);

  // 内容变长时 textarea 会冒出滚动条，可用宽度随之变窄 —— 得重新量一次
  useEffect(() => {
    syncWidth();
  }, [value, syncWidth]);

  const placeholderStyle = usePlaceholderStyle();

  return (
    <div>
      <div
        style={{
          position: 'relative',
          border: '1px solid var(--ant-color-border, #d9d9d9)',
          borderRadius: 6,
          background: 'var(--ant-color-fill-quaternary, #fafafa)',
          ...(disabled ? { opacity: 0.6 } : null),
        }}
      >
        <pre
          ref={mirrorRef}
          aria-hidden="true"
          style={{
            ...TEXT_STYLE,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 'auto',
            bottom: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
            color: 'var(--ant-color-text, rgba(0, 0, 0, 0.88))',
          }}
        >
          {value
            ? renderParts(value, placeholderStyle)
            : placeholder && (
                <span
                  style={{
                    color:
                      'var(--ant-color-text-quaternary, rgba(0, 0, 0, 0.25))',
                  }}
                >
                  {placeholder}
                </span>
              )}
        </pre>
        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          rows={rows}
          maxLength={maxLength}
          disabled={disabled}
          style={{
            ...TEXT_STYLE,
            position: 'relative',
            width: '100%',
            resize: 'vertical',
            outline: 'none',
            // 文字交给镜像层渲染，textarea 只负责输入与光标
            color: 'transparent',
            caretColor: 'var(--ant-color-text, rgba(0, 0, 0, 0.88))',
          }}
        />
      </div>
      {maxLength ? (
        <div
          style={{
            marginTop: 4,
            textAlign: 'right',
            fontSize: 12,
            color: 'var(--ant-color-text-secondary, rgba(0, 0, 0, 0.45))',
          }}
        >
          {value.length}/{maxLength}
        </div>
      ) : null}
    </div>
  );
}
