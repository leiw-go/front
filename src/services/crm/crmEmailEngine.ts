// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

/** 查询邮件生成历史 按生成时间倒排分页查询所有生成过的邮件 GET /api/crm/email-engine/history */
export async function listEmailGenerationHistory(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.listEmailGenerationHistoryParams,
  options?: { [key: string]: any }
) {
  return request<Crm.ResponseResultPageResponseCrmEmailGenerationDto>(
    "/api/crm/email-engine/history",
    {
      method: "GET",
      params: {
        // page has a default value: 1
        page: "1",
        // size has a default value: 20
        size: "20",
        ...params,
      },
      ...(options || {}),
    }
  );
}

/** 查询邮件生成历史详情 按 ID 查询一条生成记录 GET /api/crm/email-engine/history/${param0} */
export async function getEmailGenerationHistory(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.getEmailGenerationHistoryParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultCrmEmailGenerationDto>(
    `/api/crm/email-engine/history/${param0}`,
    {
      method: "GET",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** 删除邮件生成历史 逻辑删除一条生成记录 DELETE /api/crm/email-engine/history/${param0} */
export async function deleteEmailGenerationHistory(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: Crm.deleteEmailGenerationHistoryParams,
  options?: { [key: string]: any }
) {
  const { id: param0, ...queryParams } = params;
  return request<Crm.ResponseResultBoolean>(
    `/api/crm/email-engine/history/${param0}`,
    {
      method: "DELETE",
      params: { ...queryParams },
      ...(options || {}),
    }
  );
}

/** 查询改写可选项 返回目标语言、语气、场景与可用模型 GET /api/crm/email-engine/options */
export async function emailEngineOptions(options?: { [key: string]: any }) {
  return request<Crm.ResponseResultCrmEmailEngineOptionsDto>(
    "/api/crm/email-engine/options",
    {
      method: "GET",
      ...(options || {}),
    }
  );
}

/** AI 改写邮件（流式） 把基础邮件改写成专业商务邮件，SSE 流式返回 meta/reasoning/delta/done/error 事件 POST /api/crm/email-engine/rewrite */
export async function rewriteCrmEmail(
  body: Crm.CrmEmailEngineRewriteRequest,
  options?: { [key: string]: any }
) {
  return request<string>("/api/crm/email-engine/rewrite", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}

/** 保存为邮件模板 把改写结果存进 t_email_template，可在邮件管理里群发 POST /api/crm/email-engine/templates */
export async function saveEmailEngineTemplate(
  body: Crm.CrmEmailTemplateRequest,
  options?: { [key: string]: any }
) {
  return request<Crm.ResponseResultCrmEmailTemplateDto>(
    "/api/crm/email-engine/templates",
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
