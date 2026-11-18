import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import EmailGenerationHistory from './history';

const listEmailGenerationHistory = vi.fn();
const deleteEmailGenerationHistory = vi.fn();
const emailEngineOptions = vi.fn();

vi.mock('@/services/crm/crmEmailEngine', () => ({
  listEmailGenerationHistory: (...args: unknown[]) =>
    listEmailGenerationHistory(...args),
  deleteEmailGenerationHistory: (...args: unknown[]) =>
    deleteEmailGenerationHistory(...args),
  emailEngineOptions: (...args: unknown[]) => emailEngineOptions(...args),
}));

const HISTORY_ROW = {
  id: 'g-1',
  requestId: 'req-1',
  subject: 'LED Strip Quotation',
  content: 'Dear Sir, could you please help me?',
  language: 'en',
  tone: 'new_customer',
  scene: 'quotation',
  model: 'minimax-cn:MiniMax-M3.1-Flash',
  elapsedMs: 1234,
  totalTokens: 300,
  ownerId: 'admin',
  createTime: '2026-11-18T10:20:30',
};

const OPTIONS = {
  data: {
    languages: [{ code: 'en', label: '英语（English）' }],
    tones: [
      { code: 'new_customer', label: '新客户语气' },
      { code: 'existing_customer', label: '老客户语气' },
    ],
    scenes: [{ code: 'quotation', label: '报价与议价' }],
  },
};

function renderHistory(onUseAsDraft?: (item: any) => void) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <EmailGenerationHistory onUseAsDraft={onUseAsDraft} />
    </QueryClientProvider>,
  );
}

describe('EmailGenerationHistory', () => {
  it('没有记录时显示空态', async () => {
    listEmailGenerationHistory.mockResolvedValue({
      data: { data: [], total: 0, page: 1, size: 20 },
    });
    emailEngineOptions.mockResolvedValue(OPTIONS);

    renderHistory();

    await waitFor(() =>
      expect(screen.getByText('还没有生成记录')).toBeTruthy(),
    );
  });

  it('按时间倒排展示历史条目', async () => {
    listEmailGenerationHistory.mockResolvedValue({
      data: {
        data: [HISTORY_ROW],
        total: 1,
        page: 1,
        size: 20,
      },
    });
    emailEngineOptions.mockResolvedValue(OPTIONS);

    renderHistory();

    await waitFor(() =>
      expect(screen.getByText('LED Strip Quotation')).toBeTruthy(),
    );
    expect(screen.getByText('2026-11-18 10:20')).toBeTruthy();
    // 语气标签用的是中文展示名（options 接口返回的）
    expect(screen.getAllByText('新客户语气').length).toBeGreaterThan(0);
  });

  it('点「粘回草稿」把这条历史交回给页面', async () => {
    listEmailGenerationHistory.mockResolvedValue({
      data: { data: [HISTORY_ROW], total: 1, page: 1, size: 20 },
    });
    emailEngineOptions.mockResolvedValue(OPTIONS);
    const onUseAsDraft = vi.fn();

    renderHistory(onUseAsDraft);

    await waitFor(() =>
      expect(screen.getByText('LED Strip Quotation')).toBeTruthy(),
    );
    const buttons = screen.getAllByText('粘回草稿');
    buttons[0].click();

    await waitFor(() => expect(onUseAsDraft).toHaveBeenCalled());
    expect(onUseAsDraft.mock.calls[0][0]).toMatchObject({
      id: 'g-1',
      subject: 'LED Strip Quotation',
    });
  });
});
