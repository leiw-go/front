// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** Get customer contact 查询联系人详情 GET /api/crm/contacts/${param0} */
export async function getContact(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.getContactParams,
  options?: { [key: string]: any }
) {
  const { contactId: param0, ...queryParams } = params;
  return request<Crm.ResponseResultCustomerContactDto>(
    `/api/crm/contacts/${param0}`,
    {
      method: "GET",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** Update customer contact 更新联系人 PUT /api/crm/contacts/${param0} */
export async function updateContact(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.updateContactParams,
  body: Crm.CustomerContactRequest,
  options?: { [key: string]: any }
) {
  const { contactId: param0, ...queryParams } = params;
  return request<Crm.ResponseResultCustomerContactDto>(
    `/api/crm/contacts/${param0}`,
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

/** Delete customer contact 删除联系人（逻辑删除） DELETE /api/crm/contacts/${param0} */
export async function deleteContact(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.deleteContactParams,
  options?: { [key: string]: any }
) {
  const { contactId: param0, ...queryParams } = params;
  return request<Crm.ResponseResultVoid>(`/api/crm/contacts/${param0}`, {
    method: "DELETE",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** List customer contacts 查询某客户下的联系人列表 GET /api/crm/customers/${param0}/contacts */
export async function listCustomerContacts(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.listCustomerContactsParams,
  options?: { [key: string]: any }
) {
  const { customerId: param0, ...queryParams } = params;
  return request<Crm.ResponseResultListCustomerContactDto>(
    `/api/crm/customers/${param0}/contacts`,
    {
      method: "GET",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** Create customer contact 新建联系人，校验邮箱唯一、E.164 电话与客户内号码唯一 POST /api/crm/customers/${param0}/contacts */
export async function createContact(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.createContactParams,
  body: Crm.CustomerContactRequest,
  options?: { [key: string]: any }
) {
  const { customerId: param0, ...queryParams } = params;
  return request<Crm.ResponseResultCustomerContactDto>(
    `/api/crm/customers/${param0}/contacts`,
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
