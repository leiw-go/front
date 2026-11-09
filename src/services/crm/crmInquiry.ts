// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** List inquiries 分页查询询盘列表，可按状态 / 客户 / 负责人 / 超时未报价筛选 GET /api/crm/inquiries */
export async function listInquiries(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.listInquiriesParams,
  options?: { [key: string]: any }
) {
  return request<Crm.ResponseResultPageResponseCrmInquiryDto>(
    "/api/crm/inquiries",
    {
      method: "GET",
      params: {
        ...params,
      },
      ...(options || {}),
    }
  );
}

/** Create inquiry 新建询盘 POST /api/crm/inquiries */
export async function createInquiry(
  body: Crm.CrmInquiryRequest,
  options?: { [key: string]: any }
) {
  return request<Crm.ResponseResultCrmInquiryDto>("/api/crm/inquiries", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** Get inquiry 查询询盘详情，含关联报价单 GET /api/crm/inquiries/${param0} */
export async function getInquiry(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.getInquiryParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultCrmInquiryDto>(
    `/api/crm/inquiries/${param0}`,
    {
      method: "GET",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** Update inquiry 更新询盘 PUT /api/crm/inquiries/${param0} */
export async function updateInquiry(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.updateInquiryParams,
  body: Crm.CrmInquiryRequest,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultCrmInquiryDto>(
    `/api/crm/inquiries/${param0}`,
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

/** Create quotation from inquiry 基于询盘创建报价单（新版本） POST /api/crm/inquiries/${param0}/quotations */
export async function createQuotationFromInquiry(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.createQuotationFromInquiryParams,
  body: Crm.CrmQuotationRequest,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultCrmQuotationDto>(
    `/api/crm/inquiries/${param0}/quotations`,
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
