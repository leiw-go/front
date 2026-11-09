/**
 * 生成 CRM 前端 service 层。
 *
 * 数据源：config/oneapi.json（已合并后端 /api/crm/** 的 OpenAPI 定义）。
 * 输出：src/services/crm/**（由 @umijs/openapi 生成，勿手改）。
 *
 * 用法：npm run openapi:crm
 *
 * 为什么不直接用 `npm run openapi`（max openapi）：
 * 那条命令会按 config/config.ts 的 openAPI 配置整目录重建 src/services/ant-design-pro，
 * 而该目录下的 api.ts / typings.d.ts 目前是人工合并维护的（内含 users / roles / lottery
 * 等后端接口），重建会把这些函数清掉、打断 13 个既有页面。CRM 单独走本脚本，
 * 只读 oneapi.json 里的 /api/crm/** 部分，输出到独立命名空间 Crm，互不干扰。
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { generateService } = require('@umijs/openapi');

const ROOT = path.join(__dirname, '..');
const SCHEMA_PATH = path.join(ROOT, 'config/oneapi.json');
const SERVER_PATH = path.join(ROOT, 'src/services');
const PROJECT_NAME = 'crm';
const NAMESPACE = 'Crm';
const CRM_PREFIX = '/api/crm/';

/**
 * 前端函数名映射。
 *
 * 后端 operationId 直接来自 springdoc，其中一部分与存量（彩票 / 用户域）接口重名，
 * springdoc 会追加 `_1` 后缀（如 createProduct_1）。这些名字进入前端 service 层
 * 容易被误读成"第二个同名接口"，这里统一改成语义明确且不冲突的名字。
 */
const OPERATION_RENAMES = {
  // 产品
  listProducts: 'listCrmProducts',
  getProduct: 'getCrmProduct',
  createProduct_1: 'createCrmProduct',
  updateProduct_1: 'updateCrmProduct',
  deleteProduct_1: 'deleteCrmProduct',
  listPrices: 'listCrmProductPrices',
  replacePrices: 'replaceCrmProductPrices',
  // 报价 / 询盘
  createQuotation_1: 'createQuotationFromInquiry',
  // 看板 / 漏斗
  pipeline: 'opportunityPipeline',
  pipeline_1: 'dashboardPipeline',
  summary: 'dashboardSummary',
  trend: 'dashboardTrend',
  customerSource: 'dashboardCustomerSource',
  receivableAging: 'dashboardReceivableAging',
  topProducts: 'dashboardTopProducts',
  // 联系人
  listByCustomer: 'listCustomerContacts',
  create: 'createContact',
  getById: 'getContact',
  update: 'updateContact',
  delete: 'deleteContact',
  // 汇率
  convert: 'convertCurrency',
  listRates: 'listCurrencyRates',
  saveManualRate: 'saveCurrencyRate',
  verification: 'verifyCurrencyRates',
  sync: 'syncCurrencyRates',
  syncStatus: 'getCurrencySyncStatus',
  // 邮件
  listTemplates: 'listEmailTemplates',
  saveTemplate: 'saveEmailTemplate',
  deleteTemplate: 'deleteEmailTemplate',
  preview: 'previewEmailTemplate',
  listCampaigns: 'listEmailCampaigns',
  createCampaign: 'createEmailCampaign',
  send: 'sendEmailCampaign',
  listLogs: 'listEmailCampaignLogs',
  // 站内信
  markAllRead: 'markAllMessagesRead',
  unreadCount: 'getUnreadMessageCount',
  markRead: 'markMessageRead',
  // 应收
  aging: 'listReceivableAging',
  writeOff: 'writeOffReceivable',
};

/**
 * 后端把查询参数整体建模成一个对象（如 CustomerQueryRequest），
 * springdoc 会导出成一个 `in: query` 且 schema 为 $ref 的参数，
 * 生成器会把它当成名为 `query` 的单一查询串。这里把 $ref 展开成扁平参数。
 */
function expandQueryParams(doc) {
  const schemas = doc.components?.schemas || {};
  Object.values(doc.paths).forEach((pathItem) => {
    Object.values(pathItem).forEach((operation) => {
      if (!operation.parameters) return;
      const expanded = [];
      operation.parameters.forEach((param) => {
        const refName = param.schema?.$ref?.split('/').pop();
        if (param.in !== 'query' || !refName || !schemas[refName]) {
          expanded.push(param);
          return;
        }
        const target = schemas[refName];
        const required = new Set(target.required || []);
        Object.entries(target.properties || {}).forEach(([name, schema]) => {
          expanded.push({
            name,
            in: 'query',
            required: required.has(name),
            schema,
          });
        });
      });
      operation.parameters = expanded;
    });
  });
}

/** 只保留 CRM 相关路径及其可达的 schema */
function pickCrmDocument(doc) {
  const paths = {};
  Object.entries(doc.paths).forEach(([pathKey, pathItem]) => {
    if (!pathKey.startsWith(CRM_PREFIX)) return;
    Object.values(pathItem).forEach((operation) => {
      if (operation.operationId in OPERATION_RENAMES) {
        operation.operationId = OPERATION_RENAMES[operation.operationId];
      }
    });
    paths[pathKey] = pathItem;
  });

  const schemas = {};
  const pending = new Set();
  const collect = (node) => {
    if (Array.isArray(node)) {
      node.forEach(collect);
      return;
    }
    if (node && typeof node === 'object') {
      Object.entries(node).forEach(([key, value]) => {
        if (key === '$ref' && typeof value === 'string') {
          const name = value.split('/').pop();
          if (name && !schemas[name]) pending.add(name);
        } else {
          collect(value);
        }
      });
    }
  };
  collect(paths);

  while (pending.size > 0) {
    const name = pending.values().next().value;
    pending.delete(name);
    const schema = doc.components?.schemas?.[name];
    if (!schema) continue;
    schemas[name] = schema;
    collect(schema);
  }

  return {
    ...doc,
    paths,
    components: { ...doc.components, schemas },
  };
}

async function main() {
  const source = JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf-8'));
  const doc = pickCrmDocument(source);
  expandQueryParams(doc);

  const pathCount = Object.keys(doc.paths).length;
  if (pathCount === 0) {
    console.error(
      `[openapi:crm] ${SCHEMA_PATH} 里没有 ${CRM_PREFIX} 开头的路径，终止。`,
    );
    process.exit(1);
  }

  // generateService 内部用 require() 读取 schema，必须落成 .json 文件
  const tmpFile = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'crm-openapi-')),
    'schema.json',
  );
  fs.writeFileSync(tmpFile, JSON.stringify(doc, null, 2));

  await generateService({
    schemaPath: tmpFile,
    projectName: PROJECT_NAME,
    serversPath: SERVER_PATH,
    namespace: NAMESPACE,
    requestLibPath: "import { request } from '@umijs/max'",
    requestOptionsType: '{ [key: string]: any }',
  });

  console.log(
    `[openapi:crm] 已生成 ${pathCount} 个 CRM 路径 -> src/services/${PROJECT_NAME}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
