// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** List countries 国家列表，可按国家码 / 英文名 / 中文名搜索 GET /api/crm/countries */
export async function listCrmCountries(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.listCrmCountriesParams,
  options?: { [key: string]: any }
) {
  return request<Crm.ResponseResultPageResponseCrmCountryRefDto>(
    "/api/crm/countries",
    {
      method: "GET",
      params: {
        ...params,
      },
      ...(options || {}),
    }
  );
}

/** Get country info 查询国家信息：时区、当前时间、主要货币、对美元与人民币的汇率 GET /api/crm/countries/info */
export async function getCrmCountryInfo(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.getCrmCountryInfoParams,
  options?: { [key: string]: any }
) {
  return request<Crm.ResponseResultCrmCountryInfoDto>(
    "/api/crm/countries/info",
    {
      method: "GET",
      params: {
        ...params,
      },
      ...(options || {}),
    }
  );
}
