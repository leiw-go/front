// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** List shipments 分页查询发货单列表 GET /api/crm/shipments */
export async function listShipments(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.listShipmentsParams,
  options?: { [key: string]: any }
) {
  return request<Crm.ResponseResultPageResponseCrmShipmentDto>(
    "/api/crm/shipments",
    {
      method: "GET",
      params: {
        ...params,
      },
      ...(options || {}),
    }
  );
}

/** Create shipment 新建发货单，首次发货时订单置 SHIPPED POST /api/crm/shipments */
export async function createShipment(
  body: Crm.CrmShipmentRequest,
  options?: { [key: string]: any }
) {
  return request<Crm.ResponseResultCrmShipmentDto>("/api/crm/shipments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** Update shipment 更新发货单 PUT /api/crm/shipments/${param0} */
export async function updateShipment(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.updateShipmentParams,
  body: Crm.CrmShipmentRequest,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultCrmShipmentDto>(
    `/api/crm/shipments/${param0}`,
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
