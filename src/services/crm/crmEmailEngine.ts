// @ts-ignore
/* eslint-disable */
import { request } from "@umijs/max";

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
