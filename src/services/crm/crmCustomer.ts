// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** List customers 分页查询客户列表 GET /api/crm/customers */
export async function listCustomers(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.listCustomersParams,
  options?: { [key: string]: any }
) {
  return request<Crm.ResponseResultPageResponseCustomerDto>(
    "/api/crm/customers",
    {
      method: "GET",
      params: {
        ...params,
      },
      ...(options || {}),
    }
  );
}

/** Create customer 新建客户 POST /api/crm/customers */
export async function createCustomer(
  body: Crm.CustomerRequest,
  options?: { [key: string]: any }
) {
  return request<Crm.ResponseResultCustomerDto>("/api/crm/customers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** Get customer 查询客户详情 GET /api/crm/customers/${param0} */
export async function getCustomer(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.getCustomerParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultCustomerDto>(
    `/api/crm/customers/${param0}`,
    {
      method: "GET",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** Update customer 更新客户 PUT /api/crm/customers/${param0} */
export async function updateCustomer(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.updateCustomerParams,
  body: Crm.CustomerRequest,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultCustomerDto>(
    `/api/crm/customers/${param0}`,
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

/** Delete customer 逻辑删除客户 DELETE /api/crm/customers/${param0} */
export async function deleteCustomer(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.deleteCustomerParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultVoid>(`/api/crm/customers/${param0}`, {
    method: "DELETE",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** Transfer customer 转交客户负责人 POST /api/crm/customers/${param0}/transfer */
export async function transferCustomer(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.transferCustomerParams,
  body: Crm.TransferRequest,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultCustomerDto>(
    `/api/crm/customers/${param0}/transfer`,
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

/** Customer dictionary options 客户下拉选项 GET /api/crm/customers/dictionary-options */
export async function dictionaryOptions(options?: { [key: string]: any }) {
  return request<Crm.ResponseResultDictionaryOptions>(
    "/api/crm/customers/dictionary-options",
    {
      method: "GET",
      ...(options || {}),
    }
  );
}

/** Export customers 导出客户为 Excel（上限 1 万行） GET /api/crm/customers/export */
export async function exportCustomers(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.exportCustomersParams,
  options?: { [key: string]: any }
) {
  return request<any>("/api/crm/customers/export", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}
