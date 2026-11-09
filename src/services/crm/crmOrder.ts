// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** List orders 分页查询订单列表 GET /api/crm/orders */
export async function listOrders(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.listOrdersParams,
  options?: { [key: string]: any }
) {
  return request<Crm.ResponseResultPageResponseCrmOrderDto>("/api/crm/orders", {
    method: "GET",
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** Create order 新建订单，可带 quotationId 由报价生成 POST /api/crm/orders */
export async function createOrder(
  body: Crm.CrmOrderRequest,
  options?: { [key: string]: any }
) {
  return request<Crm.ResponseResultCrmOrderDto>("/api/crm/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** Get order 查询订单详情，含明细、发货与收款 GET /api/crm/orders/${param0} */
export async function getOrder(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.getOrderParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultCrmOrderDto>(`/api/crm/orders/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** Update order 更新订单，仅未发货可改 PUT /api/crm/orders/${param0} */
export async function updateOrder(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.updateOrderParams,
  body: Crm.CrmOrderRequest,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultCrmOrderDto>(`/api/crm/orders/${param0}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    params: { ...queryParams },
    data: body,
    ...(options || {}),
  });
}

/** Delete order 逻辑删除订单，已发货不可删 DELETE /api/crm/orders/${param0} */
export async function deleteOrder(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.deleteOrderParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultVoid>(`/api/crm/orders/${param0}`, {
    method: "DELETE",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** Receive order payment 登记收款，核销指定应收 POST /api/crm/orders/${param0}/receive */
export async function receiveOrder(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.receiveOrderParams,
  body: Crm.CrmOrderReceiveRequest,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultCrmOrderDto>(
    `/api/crm/orders/${param0}/receive`,
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

/** Ship order 登记发货，首次发货时订单置 SHIPPED POST /api/crm/orders/${param0}/ship */
export async function shipOrder(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.shipOrderParams,
  body: Crm.CrmShipmentRequest,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultCrmOrderDto>(
    `/api/crm/orders/${param0}/ship`,
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
