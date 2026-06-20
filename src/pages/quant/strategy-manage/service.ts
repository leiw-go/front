/**
 * Service layer for the quant strategy management page.
 *
 * Talks to the Spring Boot backend at /api/quant/*. The backend in turn
 * spawns the Python CLI (jqdatasdk wrapper) for actual JoinQuant calls.
 */
import { request } from '@umijs/max';
import type {
  QuantAccountInfo,
  QuantAccountItem,
  QuantOrder,
  QuantPageResult,
  QuantPosition,
  QuantStrategyItem,
  QuantTrade,
} from './data.d';

export interface ListStrategiesParams {
  current?: number;
  pageSize?: number;
  name?: string;
  accountId?: string;
  status?: string;
  strategyType?: string;
}

export async function pageStrategies(params: ListStrategiesParams) {
  return request<API.ResponseResult<QuantPageResult<QuantStrategyItem>>>(
    '/api/quant/strategies',
    {
      method: 'GET',
      params,
    },
  );
}

export async function getStrategy(id: string) {
  return request<API.ResponseResult<QuantStrategyItem>>(
    `/api/quant/strategies/${id}`,
    { method: 'GET' },
  );
}

export async function createStrategy(body: QuantStrategyItem) {
  return request<API.ResponseResult<QuantStrategyItem>>('/api/quant/strategies', {
    method: 'POST',
    data: body,
  });
}

export async function updateStrategy(id: string, body: QuantStrategyItem) {
  return request<API.ResponseResult<QuantStrategyItem>>(
    `/api/quant/strategies/${id}`,
    {
      method: 'PUT',
      data: body,
    },
  );
}

export async function deleteStrategy(id: string) {
  return request<API.ResponseResult<null>>(`/api/quant/strategies/${id}`, {
    method: 'DELETE',
  });
}

export async function runStrategy(id: string) {
  return request<API.ResponseResult<QuantStrategyItem>>(
    `/api/quant/strategies/${id}/run`,
    { method: 'POST' },
  );
}

export async function stopStrategy(id: string) {
  return request<API.ResponseResult<QuantStrategyItem>>(
    `/api/quant/strategies/${id}/stop`,
    { method: 'POST' },
  );
}

export async function refreshStrategy(id: string) {
  return request<API.ResponseResult<QuantStrategyItem>>(
    `/api/quant/strategies/${id}/refresh`,
    { method: 'POST' },
  );
}

export async function getStrategyAccountInfo(id: string) {
  return request<API.ResponseResult<QuantAccountInfo>>(
    `/api/quant/strategies/${id}/account`,
    { method: 'GET' },
  );
}

export async function getStrategyPositions(id: string) {
  return request<API.ResponseResult<QuantPosition[]>>(
    `/api/quant/strategies/${id}/positions`,
    { method: 'GET' },
  );
}

export async function getStrategyOrders(id: string) {
  return request<API.ResponseResult<QuantOrder[]>>(
    `/api/quant/strategies/${id}/orders`,
    { method: 'GET' },
  );
}

export async function getStrategyTrades(id: string) {
  return request<API.ResponseResult<QuantTrade[]>>(
    `/api/quant/strategies/${id}/trades`,
    { method: 'GET' },
  );
}

export async function listAccounts() {
  return request<API.ResponseResult<QuantAccountItem[]>>('/api/quant/accounts', {
    method: 'GET',
  });
}

export async function createAccount(body: QuantAccountItem) {
  return request<API.ResponseResult<QuantAccountItem>>('/api/quant/accounts', {
    method: 'POST',
    data: body,
  });
}

export async function updateAccount(id: string, body: QuantAccountItem) {
  return request<API.ResponseResult<QuantAccountItem>>(
    `/api/quant/accounts/${id}`,
    { method: 'PUT', data: body },
  );
}

export async function deleteAccount(id: string) {
  return request<API.ResponseResult<null>>(`/api/quant/accounts/${id}`, {
    method: 'DELETE',
  });
}

export async function testAccount(id: string) {
  return request<API.ResponseResult<string>>(`/api/quant/accounts/${id}/test`, {
    method: 'POST',
  });
}
