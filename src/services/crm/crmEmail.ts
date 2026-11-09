// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** List email campaigns 邮件群发任务列表 GET /api/crm/email/campaigns */
export async function listEmailCampaigns(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.listEmailCampaignsParams,
  options?: { [key: string]: any }
) {
  return request<Crm.ResponseResultListCrmEmailCampaignDto>(
    "/api/crm/email/campaigns",
    {
      method: "GET",
      params: {
        ...params,
      },
      ...(options || {}),
    }
  );
}

/** Create email campaign 创建邮件群发任务 POST /api/crm/email/campaigns */
export async function createEmailCampaign(
  body: Crm.CrmEmailCampaignRequest,
  options?: { [key: string]: any }
) {
  return request<Crm.ResponseResultCrmEmailCampaignDto>(
    "/api/crm/email/campaigns",
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

/** List email campaign logs 邮件群发发送明细 GET /api/crm/email/campaigns/${param0}/logs */
export async function listEmailCampaignLogs(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.listEmailCampaignLogsParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultListCrmEmailLogDto>(
    `/api/crm/email/campaigns/${param0}/logs`,
    {
      method: "GET",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** Send email campaign 执行邮件群发（本期只落库发送记录） POST /api/crm/email/campaigns/${param0}/send */
export async function sendEmailCampaign(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.sendEmailCampaignParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultCrmEmailCampaignDto>(
    `/api/crm/email/campaigns/${param0}/send`,
    {
      method: "POST",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** List email templates 邮件模板列表 GET /api/crm/email/templates */
export async function listEmailTemplates(options?: { [key: string]: any }) {
  return request<Crm.ResponseResultListCrmEmailTemplateDto>(
    "/api/crm/email/templates",
    {
      method: "GET",
      ...(options || {}),
    }
  );
}

/** Save email template 新建或更新邮件模板 POST /api/crm/email/templates */
export async function saveEmailTemplate(
  body: Crm.CrmEmailTemplateRequest,
  options?: { [key: string]: any }
) {
  return request<Crm.ResponseResultCrmEmailTemplateDto>(
    "/api/crm/email/templates",
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

/** Delete email template 删除邮件模板 DELETE /api/crm/email/templates/${param0} */
export async function deleteEmailTemplate(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.deleteEmailTemplateParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultVoid>(`/api/crm/email/templates/${param0}`, {
    method: "DELETE",
    params: { ...queryParams },
    ...(options || {}),
  });
}

/** Preview email template 预览模板渲染结果 POST /api/crm/email/templates/${param0}/preview */
export async function previewEmailTemplate(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.previewEmailTemplateParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultCrmEmailPreviewDto>(
    `/api/crm/email/templates/${param0}/preview`,
    {
      method: "POST",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}
