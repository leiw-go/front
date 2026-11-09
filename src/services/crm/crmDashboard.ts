// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** Dashboard customer source 客户来源分布 GET /api/crm/dashboard/customer-source */
export async function dashboardCustomerSource(options?: {
  [key: string]: any;
}) {
  return request<Crm.ResponseResultListCrmDashboardCustomerSourceDto>(
    "/api/crm/dashboard/customer-source",
    {
      method: "GET",
      ...(options || {}),
    }
  );
}

/** Dashboard pipeline 销售漏斗 GET /api/crm/dashboard/pipeline */
export async function dashboardPipeline(options?: { [key: string]: any }) {
  return request<Crm.ResponseResultCrmOpportunityPipelineDto>(
    "/api/crm/dashboard/pipeline",
    {
      method: "GET",
      ...(options || {}),
    }
  );
}

/** Dashboard receivable aging 应收账龄（未回款金额按到期日分桶） GET /api/crm/dashboard/receivable-aging */
export async function dashboardReceivableAging(options?: {
  [key: string]: any;
}) {
  return request<Crm.ResponseResultCrmDashboardReceivableAgingDto>(
    "/api/crm/dashboard/receivable-aging",
    {
      method: "GET",
      ...(options || {}),
    }
  );
}

/** Dashboard summary 顶部指标 GET /api/crm/dashboard/summary */
export async function dashboardSummary(options?: { [key: string]: any }) {
  return request<Crm.ResponseResultCrmDashboardSummaryDto>(
    "/api/crm/dashboard/summary",
    {
      method: "GET",
      ...(options || {}),
    }
  );
}

/** Dashboard top products 产品成交排行（按成交金额） GET /api/crm/dashboard/top-products */
export async function dashboardTopProducts(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.dashboardTopProductsParams,
  options?: { [key: string]: any }
) {
  return request<Crm.ResponseResultListCrmDashboardTopProductDto>(
    "/api/crm/dashboard/top-products",
    {
      method: "GET",
      params: {
        ...params,
      },
      ...(options || {}),
    }
  );
}

/** Dashboard trend 业绩趋势（按月 / 按季） GET /api/crm/dashboard/trend */
export async function dashboardTrend(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.dashboardTrendParams,
  options?: { [key: string]: any }
) {
  return request<Crm.ResponseResultListCrmDashboardTrendDto>(
    "/api/crm/dashboard/trend",
    {
      method: "GET",
      params: {
        ...params,
      },
      ...(options || {}),
    }
  );
}
