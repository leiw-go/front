// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** List quotations 分页查询报价单列表 GET /api/crm/quotations */
export async function listQuotations(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.listQuotationsParams,
  options?: { [key: string]: any }
) {
  return request<Crm.ResponseResultPageResponseCrmQuotationDto>(
    "/api/crm/quotations",
    {
      method: "GET",
      params: {
        ...params,
      },
      ...(options || {}),
    }
  );
}

/** Create quotation 新建报价单，单价与金额由服务端计算 POST /api/crm/quotations */
export async function createQuotation(
  body: Crm.CrmQuotationRequest,
  options?: { [key: string]: any }
) {
  return request<Crm.ResponseResultCrmQuotationDto>("/api/crm/quotations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** Get quotation 查询报价单详情，含明细、金额汇总与利润 GET /api/crm/quotations/${param0} */
export async function getQuotation(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.getQuotationParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultCrmQuotationDto>(
    `/api/crm/quotations/${param0}`,
    {
      method: "GET",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** Update quotation 更新报价单（仅 DRAFT 可改），改完服务端重算 PUT /api/crm/quotations/${param0} */
export async function updateQuotation(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.updateQuotationParams,
  body: Crm.CrmQuotationRequest,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultCrmQuotationDto>(
    `/api/crm/quotations/${param0}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      params: { ...queryParams },
      data: body,
      ...(options || {}),
    }
  );
}

/** Confirm quotation 客户确认（SENT → CONFIRMED） POST /api/crm/quotations/${param0}/confirm */
export async function confirm(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.confirmParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultCrmQuotationDto>(
    `/api/crm/quotations/${param0}/confirm`,
    {
      method: "POST",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** Recalculate quotation 按当前加价率 / 折扣重算整单（覆盖非手工改价的行） POST /api/crm/quotations/${param0}/recalculate */
export async function recalculate(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.recalculateParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultCrmQuotationDto>(
    `/api/crm/quotations/${param0}/recalculate`,
    {
      method: "POST",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** Reject quotation 客户拒绝（SENT → REJECTED），必须填原因 POST /api/crm/quotations/${param0}/reject */
export async function reject(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.rejectParams,
  body: Crm.CrmQuotationRejectRequest,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultCrmQuotationDto>(
    `/api/crm/quotations/${param0}/reject`,
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

/** Submit quotation 提交发送（DRAFT → SENT） POST /api/crm/quotations/${param0}/submit */
export async function submit(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.submitParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultCrmQuotationDto>(
    `/api/crm/quotations/${param0}/submit`,
    {
      method: "POST",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** Calculate quotation 试算：只算不落库，返回每行单价 / 金额与单头汇总 POST /api/crm/quotations/calculate */
export async function calculate(
  body: Crm.CrmQuotationRequest,
  options?: { [key: string]: any }
) {
  return request<Crm.ResponseResultCrmQuotationDto>(
    "/api/crm/quotations/calculate",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data: body,
      ...(options || {}),
    }
  );
}
