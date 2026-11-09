// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** List products 分页查询产品列表 GET /api/crm/products */
export async function listCrmProducts(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.listCrmProductsParams,
  options?: { [key: string]: any }
) {
  return request<Crm.ResponseResultPageResponseCrmProductDto>(
    "/api/crm/products",
    {
      method: "GET",
      params: {
        ...params,
      },
      ...(options || {}),
    }
  );
}

/** Create product 新建产品 POST /api/crm/products */
export async function createCrmProduct(
  body: Crm.CrmProductRequest,
  options?: { [key: string]: any }
) {
  return request<Crm.ResponseResultCrmProductDto>("/api/crm/products", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** Get product 查询产品详情，含各币种参考价 GET /api/crm/products/${param0} */
export async function getCrmProduct(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.getCrmProductParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultCrmProductDto>(
    `/api/crm/products/${param0}`,
    {
      method: "GET",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** Update product 更新产品 PUT /api/crm/products/${param0} */
export async function updateCrmProduct(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.updateCrmProductParams,
  body: Crm.CrmProductRequest,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultCrmProductDto>(
    `/api/crm/products/${param0}`,
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

/** Delete product 逻辑删除产品 DELETE /api/crm/products/${param0} */
export async function deleteCrmProduct(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.deleteCrmProductParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultVoid>(`/api/crm/products/${param0}`, {
    method: "DELETE",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** List product prices 查询产品的多币种参考价 GET /api/crm/products/${param0}/prices */
export async function listCrmProductPrices(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.listCrmProductPricesParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultListCrmProductPriceDto>(
    `/api/crm/products/${param0}/prices`,
    {
      method: "GET",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** Replace product prices 批量维护多币种参考价（整批覆盖） PUT /api/crm/products/${param0}/prices */
export async function replaceCrmProductPrices(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.replaceCrmProductPricesParams,
  body: Crm.CrmProductPriceRequest[],
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultListCrmProductPriceDto>(
    `/api/crm/products/${param0}/prices`,
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
