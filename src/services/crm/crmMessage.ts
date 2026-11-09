// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** List messages 我的消息列表，未读优先 GET /api/crm/messages */
export async function listMessages(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.listMessagesParams,
  options?: { [key: string]: any }
) {
  return request<Crm.ResponseResultPageResponseMessageDto>(
    "/api/crm/messages",
    {
      method: "GET",
      params: {
        ...params,
      },
      ...(options || {}),
    }
  );
}

/** Send message 发送人工消息给同事 POST /api/crm/messages */
export async function sendMessage(
  body: Crm.MessageSendRequest,
  options?: { [key: string]: any }
) {
  return request<Crm.ResponseResultMapStringInteger>("/api/crm/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** Get message 查询消息详情，并自动标记已读 GET /api/crm/messages/${param0} */
export async function getMessage(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.getMessageParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultMessageDto>(`/api/crm/messages/${param0}`, {
    method: "GET",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** Delete message 删除自己的消息 DELETE /api/crm/messages/${param0} */
export async function deleteMessage(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.deleteMessageParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultVoid>(`/api/crm/messages/${param0}`, {
    method: "DELETE",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** Mark message read 标记消息已读 PUT /api/crm/messages/${param0}/read */
export async function markMessageRead(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.markMessageReadParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultVoid>(`/api/crm/messages/${param0}/read`, {
    method: "PUT",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** Mark all messages read 全部标记已读，可按类型限定 PUT /api/crm/messages/read-all */
export async function markAllMessagesRead(
  body: Crm.MessageQueryRequest,
  options?: { [key: string]: any }
) {
  return request<Crm.ResponseResultMapStringInteger>(
    "/api/crm/messages/read-all",
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      data: body,
      ...(options || {}),
    }
  );
}

/** Unread count 未读消息数 GET /api/crm/messages/unread-count */
export async function getUnreadMessageCount(options?: { [key: string]: any }) {
  return request<Crm.ResponseResultMapStringLong>(
    "/api/crm/messages/unread-count",
    {
      method: "GET",
      ...(options || {}),
    }
  );
}
