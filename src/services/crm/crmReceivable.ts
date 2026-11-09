// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** List receivables 分页查询应收列表 GET /api/crm/receivables */
export async function listReceivables(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.listReceivablesParams,
  options?: { [key: string]: any }
) {
  return request<Crm.ResponseResultPageResponseCrmReceivableDto>(
    "/api/crm/receivables",
    {
      method: "GET",
      params: {
        ...params,
      },
      ...(options || {}),
    }
  );
}

/** Write off receivable 登记收款并核销应收 POST /api/crm/receivables/${param0}/writeoff */
export async function writeOffReceivable(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.writeOffReceivableParams,
  body: Crm.CrmReceivableWriteOffRequest,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultCrmReceivableDto>(
    `/api/crm/receivables/${param0}/writeoff`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      params: { ...queryParams },
      data: body,
      ...(options || {}),
    }
  );
}

/** Receivable aging 应收账龄分析：0-30 / 31-60 / 61-90 / 90+ 天 GET /api/crm/receivables/aging */
export async function listReceivableAging(options?: { [key: string]: any }) {
  return request<Crm.ResponseResultCrmReceivableAgingDto>(
    "/api/crm/receivables/aging",
    {
      method: "GET",
      ...(options || {}),
    }
  );
}
