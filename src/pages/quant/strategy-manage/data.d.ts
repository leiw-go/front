/**
 * Data types for the quant strategy management page.
 *
 * These intentionally do not live in src/services/ant-design-pro/typings.d.ts
 * (that file is auto-generated from the OpenAPI spec). Mirror the
 * corresponding Java DTOs in the backend - keep the field names identical so
 * the response payloads map 1:1.
 */

export type QuantStrategyType = 'BACKTEST' | 'SIM' | 'LIVE';
export type QuantStrategyStatus =
  | 'DRAFT'
  | 'RUNNING'
  | 'STOPPED'
  | 'ERROR'
  | 'COMPLETED';

export type QuantStrategyItem = {
  id?: string;
  accountId: string;
  accountName?: string;
  name: string;
  description?: string;
  code?: string;
  parameters?: string;
  strategyType?: QuantStrategyType;
  status?: QuantStrategyStatus;
  initialCapital?: number;
  benchmark?: string;
  startDate?: string;
  endDate?: string;
  frequency?: string;
  jqStrategyId?: string;
  jqBacktestId?: string;
  lastRunTime?: string;
  lastError?: string;
  createTime?: string;
  updateTime?: string;
};

export type QuantAccountItem = {
  id?: string;
  accountName: string;
  username: string;
  password?: string;
  phone?: string;
  isActive?: number;
  lastLoginTime?: string;
  lastLoginStatus?: string;
  createTime?: string;
  updateTime?: string;
};

export type QuantPageResult<T> = {
  records: T[];
  total: number;
  current: number;
  pageSize: number;
};

export type QuantAccountInfo = {
  username: string;
  cash: number;
  positionsValue: number;
  totalValue: number;
  frozenCash?: number;
};

export type QuantPosition = {
  security: string;
  price: number;
  avgCost: number;
  volume: number;
  value: number;
  side?: string;
};

export type QuantOrder = {
  orderId: string;
  security: string;
  price: number;
  amount: number;
  side: string;
  status: string;
  filled?: number;
};

export type QuantTrade = {
  tradeId: string;
  orderId: string;
  security: string;
  price: number;
  amount: number;
  side: string;
  time?: string;
};
