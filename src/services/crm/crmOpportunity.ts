// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** List opportunities 分页查询商机列表 GET /api/crm/opportunities */
export async function listOpportunities(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.listOpportunitiesParams,
  options?: { [key: string]: any }
) {
  return request<Crm.ResponseResultPageResponseCrmOpportunityDto>(
    "/api/crm/opportunities",
    {
      method: "GET",
      params: {
        ...params,
      },
      ...(options || {}),
    }
  );
}

/** Create opportunity 新建商机 POST /api/crm/opportunities */
export async function createOpportunity(
  body: Crm.CrmOpportunityRequest,
  options?: { [key: string]: any }
) {
  return request<Crm.ResponseResultCrmOpportunityDto>(
    "/api/crm/opportunities",
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

/** Get opportunity 查询商机详情 GET /api/crm/opportunities/${param0} */
export async function getOpportunity(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.getOpportunityParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultCrmOpportunityDto>(
    `/api/crm/opportunities/${param0}`,
    {
      method: "GET",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** Update opportunity 更新商机（含推进阶段） PUT /api/crm/opportunities/${param0} */
export async function updateOpportunity(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.updateOpportunityParams,
  body: Crm.CrmOpportunityRequest,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultCrmOpportunityDto>(
    `/api/crm/opportunities/${param0}`,
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

/** Delete opportunity 逻辑删除商机 DELETE /api/crm/opportunities/${param0} */
export async function deleteOpportunity(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.deleteOpportunityParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultVoid>(`/api/crm/opportunities/${param0}`, {
    method: "DELETE",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** Change opportunity stage 推进商机阶段，置 LOST 必须填 lostReason POST /api/crm/opportunities/${param0}/stage */
export async function changeStage(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.changeStageParams,
  body: Crm.CrmOpportunityStageRequest,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultCrmOpportunityDto>(
    `/api/crm/opportunities/${param0}/stage`,
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

/** Opportunity pipeline 销售漏斗统计（按当前 stage 快照） GET /api/crm/opportunities/pipeline */
export async function opportunityPipeline(options?: { [key: string]: any }) {
  return request<Crm.ResponseResultCrmOpportunityPipelineDto>(
    "/api/crm/opportunities/pipeline",
    {
      method: "GET",
      ...(options || {}),
    }
  );
}
