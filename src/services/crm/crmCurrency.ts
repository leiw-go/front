// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** List currencies 币种列表，含熔断状态 GET /api/crm/currencies */
export async function listCurrencies(options?: { [key: string]: any }) {
  return request<Crm.ResponseResultListCrmCurrencyDto>("/api/crm/currencies", {
    method: "GET",
    ...(options || {}),
  });
}

/** Convert amount 金额折算，交叉汇率走 USD 三角折算 GET /api/crm/currencies/convert */
export async function convertCurrency(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.convertCurrencyParams,
  options?: { [key: string]: any }
) {
  return request<Crm.ResponseResultCrmCurrencyConvertDto>(
    "/api/crm/currencies/convert",
    {
      method: "GET",
      params: {
        ...params,
      },
      ...(options || {}),
    }
  );
}

/** List currency rates 汇率列表，只读本地表 GET /api/crm/currencies/rates */
export async function listCurrencyRates(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.listCurrencyRatesParams,
  options?: { [key: string]: any }
) {
  return request<Crm.ResponseResultListCrmCurrencyRateDto>(
    "/api/crm/currencies/rates",
    {
      method: "GET",
      params: {
        ...params,
      },
      ...(options || {}),
    }
  );
}

/** Save manual currency rate 手工维护汇率，同步任务不覆盖 MANUAL 行 PUT /api/crm/currencies/rates */
export async function saveCurrencyRate(
  body: Crm.CrmCurrencyRateRequest,
  options?: { [key: string]: any }
) {
  return request<Crm.ResponseResultCrmCurrencyRateDto>(
    "/api/crm/currencies/rates",
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      data: body,
      ...(options || {}),
    }
  );
}

/** List currency verification details 交叉比对明细：两源原值、偏差、比对结果与拒绝原因 GET /api/crm/currencies/rates/verification */
export async function verifyCurrencyRates(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.verifyCurrencyRatesParams,
  options?: { [key: string]: any }
) {
  return request<Crm.ResponseResultListCrmCurrencyRateCheckDto>(
    "/api/crm/currencies/rates/verification",
    {
      method: "GET",
      params: {
        ...params,
      },
      ...(options || {}),
    }
  );
}

/** Trigger currency sync 手动触发汇率同步：拉两源、交叉比对、校验后入库 POST /api/crm/currencies/sync */
export async function syncCurrencyRates(options?: { [key: string]: any }) {
  return request<Crm.ResponseResultCrmCurrencySyncStatusDto>(
    "/api/crm/currencies/sync",
    {
      method: "POST",
      ...(options || {}),
    }
  );
}

/** Get currency sync status 最近一次汇率同步批次摘要 GET /api/crm/currencies/sync-status */
export async function getCurrencySyncStatus(options?: { [key: string]: any }) {
  return request<Crm.ResponseResultCrmCurrencySyncStatusDto>(
    "/api/crm/currencies/sync-status",
    {
      method: "GET",
      ...(options || {}),
    }
  );
}
