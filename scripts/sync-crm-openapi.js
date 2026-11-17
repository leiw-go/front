/**
 * 从后端拉取 OpenAPI 文档，写入 config/crm-openapi.json。
 *
 * 用法：npm run openapi:sync
 *
 * 为什么需要这一步：
 * springdoc 导出的 SSE 接口（text/event-stream）没有 schema，
 * 生成器会把它当成未知类型报 `Invalid generated type`。
 * 这里在写盘前把邮件引擎的改写接口响应补成字符串 schema。
 */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SCHEMA_PATH = path.join(ROOT, 'config/crm-openapi.json');
const API_DOCS =
  process.env.CRM_API_DOCS || 'http://127.0.0.1:8888/design/api-docs';

/** SSE 接口：响应是事件流，不是 JSON. */
const SSE_RESPONSES = {
  '/api/crm/email-engine/rewrite': {
    description: 'SSE 流：meta / reasoning / delta / done / error 事件',
    content: {
      'text/event-stream': {
        schema: {
          type: 'string',
          description:
            'SSE 事件流（每帧形如 event: delta\ndata: {"content":"..."}）',
        },
      },
    },
  },
};

async function main() {
  const response = await fetch(API_DOCS);
  if (!response.ok) {
    console.error(
      `[openapi:sync] 拉取 ${API_DOCS} 失败：${response.status} ${response.statusText}`,
    );
    process.exit(1);
  }
  const doc = await response.json();

  Object.entries(SSE_RESPONSES).forEach(([pathKey, responseSchema]) => {
    const operation = doc.paths?.[pathKey]?.post;
    if (!operation) {
      console.error(`[openapi:sync] 找不到 ${pathKey}，终止。`);
      process.exit(1);
    }
    operation.responses['200'] = responseSchema;
  });

  fs.writeFileSync(SCHEMA_PATH, `${JSON.stringify(doc, null, 2)}\n`);
  console.log(
    `[openapi:sync] 已写入 ${SCHEMA_PATH}（${Object.keys(doc.paths).length} 个路径）`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
