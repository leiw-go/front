import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  HighlightedText,
  HighlightedTextArea,
  splitPlaceholders,
} from './highlight';

describe('splitPlaceholders', () => {
  it('拆出方括号占位符', () => {
    const parts = splitPlaceholders('Send me [型号] and [价格] please');

    expect(parts.filter((part) => part.placeholder)).toEqual([
      { text: '[型号]', placeholder: true },
      { text: '[价格]', placeholder: true },
    ]);
    expect(parts.map((part) => part.text).join('')).toBe(
      'Send me [型号] and [价格] please',
    );
  });

  it('拆出花括号占位符', () => {
    const parts = splitPlaceholders('Dear {Customer Name},');

    expect(parts[1]).toEqual({ text: '{Customer Name}', placeholder: true });
  });

  it('没有占位符时整段都是普通文本', () => {
    expect(splitPlaceholders('Dear Sir or Madam,')).toEqual([
      { text: 'Dear Sir or Madam,', placeholder: false },
    ]);
  });

  it('空文本返回空数组', () => {
    expect(splitPlaceholders('')).toEqual([]);
  });

  it('跨行的方括号不当作占位符', () => {
    const parts = splitPlaceholders('a[换\n行]b');

    expect(parts.every((part) => !part.placeholder)).toBe(true);
  });
});

describe('HighlightedText', () => {
  it('占位符渲染成红色 span', () => {
    const { container } = render(
      <HighlightedText text="Please quote [型号] for us" />,
    );

    const marked = container.querySelector('span');
    expect(marked?.textContent).toBe('[型号]');
    // 颜色取自 antd 的 colorError token
    expect(marked?.style.color).toBeTruthy();
    expect(marked?.style.fontWeight).toBe('600');
  });

  it('没有占位符时不产生 span', () => {
    const { container } = render(<HighlightedText text="Dear Sir," />);

    expect(container.querySelector('span')).toBeNull();
  });
});

describe('HighlightedTextArea', () => {
  it('输入框与镜像层内容一致', () => {
    const { container } = render(
      <HighlightedTextArea value="Send [型号] please" onChange={() => {}} />,
    );

    const textarea = container.querySelector('textarea');
    const mirror = container.querySelector('pre');
    expect(textarea?.value).toBe('Send [型号] please');
    expect(mirror?.textContent).toBe('Send [型号] please');
  });

  it('镜像层里占位符标红', () => {
    const { container } = render(
      <HighlightedTextArea value="Send [型号] please" onChange={() => {}} />,
    );

    const marked = container.querySelector('pre span');
    expect(marked?.textContent).toBe('[型号]');
  });

  it('空值时镜像层显示占位提示', () => {
    const { container } = render(
      <HighlightedTextArea
        value=""
        onChange={() => {}}
        placeholder="把草稿粘贴到这里"
      />,
    );

    expect(container.querySelector('pre')?.textContent).toBe(
      '把草稿粘贴到这里',
    );
  });

  it('有字数上限时显示计数', () => {
    render(
      <HighlightedTextArea
        value="abc"
        onChange={() => {}}
        maxLength={10}
        aria-label="草稿"
      />,
    );

    expect(screen.getByText('3/10')).toBeTruthy();
  });

  it('镜像层与输入框排版一致 —— 不一致就会错位', () => {
    const { container } = render(
      <HighlightedTextArea value="abc" onChange={() => {}} />,
    );

    const textarea = container.querySelector('textarea');
    const mirror = container.querySelector('pre');
    const keys = [
      'font-family',
      'font-size',
      'line-height',
      'letter-spacing',
      'white-space',
      'word-break',
      'overflow-wrap',
      'padding',
    ];
    for (const key of keys) {
      expect(mirror?.style.getPropertyValue(key)).toBe(
        textarea?.style.getPropertyValue(key),
      );
    }
  });
});
