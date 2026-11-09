/**
 * CRM 模块共享的枚举、格式化工具。
 *
 * 枚举值与后端 crm/model/enums 及字典表保持一致（见
 * GreatBus/docs/crm-backend-requirements.md §8.1）。系统文案一律中文，不做 i18n。
 */

export type TagStatus =
  | 'Default'
  | 'Success'
  | 'Processing'
  | 'Warning'
  | 'Error'
  | 'Info';

export const CUSTOMER_STATUS: Record<
  string,
  { text: string; status: TagStatus }
> = {
  POTENTIAL: { text: '潜在', status: 'Default' },
  FOLLOWING: { text: '跟进中', status: 'Processing' },
  DEALED: { text: '已成交', status: 'Success' },
  LOST: { text: '流失', status: 'Error' },
};

export const CUSTOMER_LEVELS = [
  { label: 'A 级', value: 'A' },
  { label: 'B 级', value: 'B' },
  { label: 'C 级', value: 'C' },
];

export const CUSTOMER_SOURCES = [
  { label: '网站', value: 'WEBSITE' },
  { label: '展会', value: 'TRADE_SHOW' },
  { label: '阿里', value: 'ALIBABA' },
  { label: '邮件', value: 'EMAIL' },
  { label: '转介绍', value: 'REFERRAL' },
  { label: '其他', value: 'OTHER' },
];

export const OPPORTUNITY_STAGES = [
  { label: '初步接触', value: 'INITIAL_CONTACT' },
  { label: '需求确认', value: 'QUALIFIED' },
  { label: '已报价', value: 'QUOTED' },
  { label: '商务谈判', value: 'NEGOTIATION' },
  { label: '赢单', value: 'WON' },
  { label: '丢单', value: 'LOST' },
];

export const INQUIRY_STATUS: Record<
  string,
  { text: string; status: TagStatus }
> = {
  NEW: { text: '新询盘', status: 'Default' },
  PROCESSING: { text: '处理中', status: 'Processing' },
  QUOTED: { text: '已报价', status: 'Success' },
  WON: { text: '已成交', status: 'Success' },
  LOST: { text: '已流失', status: 'Error' },
};

export const QUOTATION_STATUS: Record<
  string,
  { text: string; status: TagStatus }
> = {
  DRAFT: { text: '草稿', status: 'Default' },
  SENT: { text: '已发送', status: 'Processing' },
  CONFIRMED: { text: '已确认', status: 'Success' },
  REJECTED: { text: '已拒绝', status: 'Error' },
  EXPIRED: { text: '已过期', status: 'Warning' },
};

export const INCOTERMS = [
  { label: 'EXW 工厂交货', value: 'EXW' },
  { label: 'FOB 装运港船上交货', value: 'FOB' },
  { label: 'CFR 成本加运费', value: 'CFR' },
  { label: 'CIF 成本保险加运费', value: 'CIF' },
  { label: 'DDP 完税后交货', value: 'DDP' },
];

/** ISO 4217 常用币种；后端不限制取值，这里给录入时提供候选 */
export const CURRENCIES = [
  'USD',
  'EUR',
  'CNY',
  'GBP',
  'JPY',
  'AUD',
  'CAD',
  'HKD',
  'SGD',
  'CHF',
];

export const UNITS = [
  { label: 'PCS 件', value: 'PCS' },
  { label: 'KG 千克', value: 'KG' },
  { label: 'CBM 立方米', value: 'CBM' },
  { label: 'SET 套', value: 'SET' },
];

export const PRODUCT_CATEGORIES = [
  { label: '家居用品', value: 'HOME' },
  { label: '户外用品', value: 'OUTDOOR' },
  { label: '厨房用品', value: 'KITCHEN' },
  { label: '电子配件', value: 'ELECTRONIC' },
  { label: '服装配饰', value: 'APPAREL' },
];

export const ORDER_STATUS: Record<string, { text: string; status: TagStatus }> =
  {
    CONFIRMED: { text: '已确认', status: 'Default' },
    IN_PRODUCTION: { text: '生产中', status: 'Processing' },
    SHIPPED: { text: '已发货', status: 'Warning' },
    DELIVERED: { text: '已交付', status: 'Success' },
    COMPLETED: { text: '已完成', status: 'Success' },
    CANCELLED: { text: '已取消', status: 'Error' },
  };

export const PAYMENT_TERMS = [
  { label: 'TT 电汇', value: 'TT' },
  { label: 'LC 信用证', value: 'LC' },
  { label: 'DP 付款交单', value: 'DP' },
  { label: 'DA 承兑交单', value: 'DA' },
  { label: 'OA 赊销', value: 'OA' },
  { label: 'PAYPAL', value: 'PAYPAL' },
];

export const SHIPPING_TYPES = [
  { label: '海运', value: 'SEA' },
  { label: '空运', value: 'AIR' },
  { label: '快递', value: 'EXPRESS' },
  { label: '陆运', value: 'TRUCK' },
];

export const SHIPMENT_STATUS: Record<
  string,
  { text: string; status: TagStatus }
> = {
  PREPARING: { text: '备货中', status: 'Default' },
  SHIPPED: { text: '已发出', status: 'Processing' },
  ARRIVED: { text: '已到港', status: 'Success' },
};

export const RECEIVABLE_STATUS: Record<
  string,
  { text: string; status: TagStatus }
> = {
  UNPAID: { text: '未收款', status: 'Default' },
  PARTIAL: { text: '部分收款', status: 'Processing' },
  PAID: { text: '已收清', status: 'Success' },
  OVERDUE: { text: '已逾期', status: 'Error' },
};

export const RECEIVABLE_TYPES = [
  { label: '定金', value: 'DEPOSIT' },
  { label: '尾款', value: 'BALANCE' },
  { label: '全款', value: 'FULL' },
];

export const MESSAGE_LEVELS: Record<
  string,
  { text: string; status: TagStatus }
> = {
  NORMAL: { text: '普通', status: 'Default' },
  IMPORTANT: { text: '重要', status: 'Warning' },
  URGENT: { text: '紧急', status: 'Error' },
};

/** 消息类型字典（后端 t_dict_item.message_type） */
export const MESSAGE_TYPES = [
  { label: '报价被拒绝', value: 'QUOTATION_REJECTED' },
  { label: '报价被确认', value: 'QUOTATION_CONFIRMED' },
  { label: '报价即将过期', value: 'QUOTATION_EXPIRING' },
  { label: '订单已确认', value: 'ORDER_CONFIRMED' },
  { label: '订单已发货', value: 'ORDER_SHIPPED' },
  { label: '应收逾期', value: 'RECEIVABLE_OVERDUE' },
  { label: '询盘超时未报价', value: 'INQUIRY_TIMEOUT' },
  { label: '客户转交', value: 'CUSTOMER_ASSIGNED' },
  { label: '商机阶段变更', value: 'OPPORTUNITY_STAGE' },
  { label: '汇率同步失败', value: 'RATE_SYNC_FAILED' },
  { label: '汇率币种熔断', value: 'RATE_CURRENCY_SUSPENDED' },
  { label: '人工消息', value: 'MANUAL' },
];

export const EMAIL_TEMPLATE_TYPES = [
  { label: '开发信', value: 'DEVELOP' },
  { label: '报价跟进', value: 'QUOTATION_FOLLOW_UP' },
  { label: '催款', value: 'DUNNING' },
];

export const EMAIL_TARGET_TYPES = [
  { label: '按标签', value: 'TAG' },
  { label: '按负责人', value: 'OWNER' },
  { label: '按客户', value: 'CUSTOMER' },
];

export const EMAIL_CAMPAIGN_STATUS: Record<
  string,
  { text: string; status: TagStatus }
> = {
  DRAFT: { text: '待发送', status: 'Default' },
  SENDING: { text: '发送中', status: 'Processing' },
  SENT: { text: '已发送', status: 'Success' },
  FAILED: { text: '发送失败', status: 'Error' },
};

export const CURRENCY_STATUS: Record<
  string,
  { text: string; status: TagStatus }
> = {
  NORMAL: { text: '正常', status: 'Success' },
  SUSPECT: { text: '熔断中', status: 'Warning' },
  DISABLED: { text: '已停用', status: 'Default' },
};

/** 金额展示：后端 BigDecimal 序列化成 number，可能带多余小数位 */
export function formatAmount(value?: number | string | null): string {
  if (value === undefined || value === null || value === '') return '-';
  const num = Number(value);
  if (Number.isNaN(num)) return '-';
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** 金额 + 币种 */
export function formatMoney(
  value?: number | string | null,
  currency?: string,
): string {
  const amount = formatAmount(value);
  if (amount === '-') return amount;
  return currency ? `${amount} ${currency}` : amount;
}

/**
 * 把后端分页响应转成 ProTable 的 request 返回值。
 *
 * 后端统一包装 { code, message, data, errors }，分页体是 { data: [], total, page, size }，
 * 注意列表字段叫 data 而不是 list。
 */
export function toTableResult<T>(res?: {
  code?: number;
  data?: { data?: T[]; total?: number };
}) {
  return {
    data: res?.data?.data ?? [],
    success: res?.code === 200,
    total: res?.data?.total ?? 0,
  };
}
