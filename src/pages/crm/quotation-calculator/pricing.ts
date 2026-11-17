/**
 * 报价算价引擎（前端镜像）。
 *
 * 算法与后端 `QuotationPricingServiceImpl` 完全一致（需求文档 §3.5.1）：
 *   行单价 = 成本价 × (1 + 加价率/100) × (1 - 折扣率/100)，保留 6 位小数
 *   行金额 = 行单价 × 数量，四舍五入到 2 位
 *   成本汇总 = Σ round(成本价 × 数量, 2)
 *   报价总额 = Σ 行金额
 *   毛利额 = 报价总额 - 成本汇总
 *   毛利率 = 毛利额 / 报价总额 × 100，保留 2 位
 *
 * 手工改价的行直接取手工单价，不参与加价率 / 折扣率计算。
 *
 * 这里的实现是为了在页面上把「计算过程」逐步展示出来；
 * 最终落库仍以后端 `POST /api/crm/quotations/calculate` 的结果为准，
 * 页面会把本地结果与后端结果逐项对照。
 */

/** 单价小数位（与后端 UNIT_PRICE_SCALE 一致） */
export const UNIT_PRICE_SCALE = 6;
/** 金额小数位 */
export const AMOUNT_SCALE = 2;
/** 比例小数位 */
export const RATE_SCALE = 2;
/** 加价率 / 折扣率换算成小数时的精度（与后端 rateFactor 一致） */
export const RATIO_SCALE = 10;
/** 单价展示精度（拼公式用） */
export const UNIT_PRALE_FIX = UNIT_PRICE_SCALE;

/** 四舍五入（HALF_UP，负数远离 0），对齐 BigDecimal#setScale */
export function roundHalfUp(value: number, scale: number): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** scale;
  const scaled = value * factor;
  const abs = Math.abs(scaled);
  // 加一点容差，避免 1.005 * 100 = 100.49999999999999 这类浮点误差被截断
  const rounded = (Math.floor(abs + 0.5 + 1e-9) * Math.sign(scaled)) / factor;
  // 消除 -0
  return rounded === 0 ? 0 : rounded;
}

export interface PricingLineInput {
  /** 行标识（仅供前端渲染 key，不参与算价） */
  rowKey?: string;
  /** 产品 id */
  productId?: string;
  /** 产品编码（展示用） */
  productCode?: string;
  /** 产品名称（展示用） */
  productName?: string;
  /** 成本单价（快照来源：产品） */
  costPrice?: number | null;
  /** 成本币种 */
  costCurrency?: string;
  /** 起订量 */
  moq?: number | null;
  /** 是否在售 */
  onSale?: boolean;
  /** 数量 */
  quantity?: number | null;
  /** 行加价率（%），为空则用单头加价率 */
  markupRate?: number | null;
  /** 行折扣率（%），为空则用单头折扣率 */
  discountRate?: number | null;
  /** 是否手工改价 */
  manualPrice?: boolean;
  /** 手工指定单价 */
  manualUnitPrice?: number | null;
}

export interface PricingStep {
  /** 步骤序号，从 1 开始 */
  step: number;
  /** 步骤标题 */
  title: string;
  /** 公式说明，如「× (1 + 30.00%)」 */
  formula?: string;
  /** 该步骤的结果 */
  value: number;
  /** 精度说明 */
  scale?: number;
  /** 备注，如「行加价率覆盖单头」 */
  note?: string;
}

export interface PricedLine extends PricingLineInput {
  /** 实际生效的加价率 */
  effectiveMarkupRate: number;
  /** 实际生效的折扣率 */
  effectiveDiscountRate: number;
  /** 行单价 */
  unitPrice: number;
  /** 行金额 */
  amount: number;
  /** 行成本（成本价 × 数量） */
  lineCost: number;
  /** 计算步骤 */
  steps: PricingStep[];
  /** 校验错误（与后端拦截规则一致） */
  errors: string[];
}

export interface PricingSummary {
  /** 报价总额 */
  totalAmount: number;
  /** 成本汇总 */
  totalCost: number;
  /** 毛利额 */
  profitAmount: number;
  /** 毛利率 % */
  profitRate: number;
}

export interface PricingOptions {
  /** 报价币种 */
  currency: string;
  /** 单头加价率 % */
  markupRate?: number | null;
  /** 单头折扣率 % */
  discountRate?: number | null;
}

export interface PricingResult {
  lines: PricedLine[];
  summary: PricingSummary;
}

/**
 * 校验一行明细，返回错误文案。规则与后端 QuotationPricingServiceImpl 一致。
 */
export function validateLine(
  line: PricingLineInput,
  currency: string,
): string[] {
  const errors: string[] = [];
  if (!line.productId) {
    errors.push('未选择产品');
    return errors;
  }
  if (line.onSale === false) {
    errors.push('产品已停售，不能报价');
  }
  if (line.costPrice === undefined || line.costPrice === null) {
    errors.push('产品未维护成本价，不能参与报价');
  }
  if (line.costCurrency && currency && line.costCurrency !== currency) {
    errors.push(`成本币种 ${line.costCurrency} 与报价币种 ${currency} 不一致`);
  }
  if (!line.quantity || line.quantity <= 0) {
    errors.push('数量必须大于 0');
  } else if (
    line.moq !== undefined &&
    line.moq !== null &&
    line.quantity < line.moq
  ) {
    errors.push(`数量低于起订量 MOQ ${line.moq}`);
  }
  if (
    line.markupRate !== undefined &&
    line.markupRate !== null &&
    (line.markupRate < 0 || line.markupRate > 1000)
  ) {
    errors.push('行加价率必须在 0 ~ 1000 之间');
  }
  if (
    line.discountRate !== undefined &&
    line.discountRate !== null &&
    (line.discountRate < 0 || line.discountRate > 100)
  ) {
    errors.push('行折扣率必须在 0 ~ 100 之间');
  }
  return errors;
}

/** 计算单行：单价、金额、成本与逐步骤 */
export function priceLine(
  line: PricingLineInput,
  options: PricingOptions,
): PricedLine {
  const errors = validateLine(line, options.currency);
  const cost = line.costPrice ?? 0;
  const quantity = line.quantity ?? 0;

  const effectiveMarkupRate =
    line.markupRate === undefined || line.markupRate === null
      ? (options.markupRate ?? 0)
      : line.markupRate;
  const effectiveDiscountRate =
    line.discountRate === undefined || line.discountRate === null
      ? (options.discountRate ?? 0)
      : line.discountRate;

  const steps: PricingStep[] = [];
  let unitPrice = 0;

  if (line.manualPrice) {
    // 手工改价：直接取手工单价，不再走加价率 / 折扣率
    unitPrice = roundHalfUp(line.manualUnitPrice ?? 0, UNIT_PRICE_SCALE);
    steps.push({
      step: 1,
      title: '成本价',
      value: cost,
      scale: UNIT_PRICE_SCALE,
      note: '来源：产品成本价快照',
    });
    steps.push({
      step: 2,
      title: '手工单价',
      formula: '跳过加价率与折扣率',
      value: unitPrice,
      scale: UNIT_PRICE_SCALE,
      note: '手工改价行不随加价率 / 折扣重算',
    });
  } else {
    const markupRatio = roundHalfUp(effectiveMarkupRate / 100, RATIO_SCALE);
    const discountRatio = roundHalfUp(effectiveDiscountRate / 100, RATIO_SCALE);
    const afterMarkup = cost * (1 + markupRatio);
    const afterDiscount = afterMarkup * (1 - discountRatio);
    unitPrice = roundHalfUp(afterDiscount, UNIT_PRICE_SCALE);

    steps.push({
      step: 1,
      title: '成本价',
      value: cost,
      scale: UNIT_PRICE_SCALE,
      note: '来源：产品成本价快照',
    });
    steps.push({
      step: 2,
      title: '加价',
      formula: `× (1 + ${effectiveMarkupRate.toFixed(2)}%)`,
      value: roundHalfUp(afterMarkup, UNIT_PRICE_SCALE),
      scale: UNIT_PRICE_SCALE,
      note:
        line.markupRate === undefined || line.markupRate === null
          ? '取单头加价率'
          : '行加价率覆盖单头',
    });
    steps.push({
      step: 3,
      title: '折扣',
      formula: `× (1 − ${effectiveDiscountRate.toFixed(2)}%)`,
      value: unitPrice,
      scale: UNIT_PRICE_SCALE,
      note:
        line.discountRate === undefined || line.discountRate === null
          ? '取单头折扣率'
          : '行折扣率覆盖单头',
    });
    steps.push({
      step: 4,
      title: '单价',
      value: unitPrice,
      scale: UNIT_PRICE_SCALE,
      note: '四舍五入到 6 位小数',
    });
  }

  const amount = roundHalfUp(unitPrice * quantity, AMOUNT_SCALE);
  const lineCost = roundHalfUp(cost * quantity, AMOUNT_SCALE);

  steps.push({
    step: steps.length + 1,
    title: '金额',
    formula: `${unitPrice.toFixed(UNIT_PRALE_FIX)} × ${quantity}`,
    value: amount,
    scale: AMOUNT_SCALE,
    note: '四舍五入到 2 位小数',
  });

  return {
    ...line,
    effectiveMarkupRate,
    effectiveDiscountRate,
    unitPrice,
    amount,
    lineCost,
    steps,
    errors,
  };
}

/** 计算整单：逐行定价 + 汇总 */
export function priceQuote(
  lines: PricingLineInput[],
  options: PricingOptions,
): PricingResult {
  const priced = lines.map((line) => priceLine(line, options));
  const totalAmount = roundHalfUp(
    priced.reduce((sum, line) => sum + line.amount, 0),
    AMOUNT_SCALE,
  );
  const totalCost = roundHalfUp(
    priced.reduce((sum, line) => sum + line.lineCost, 0),
    AMOUNT_SCALE,
  );
  const profitAmount = roundHalfUp(totalAmount - totalCost, AMOUNT_SCALE);
  const profitRate =
    totalAmount > 0
      ? roundHalfUp((profitAmount * 100) / totalAmount, RATE_SCALE)
      : 0;
  return {
    lines: priced,
    summary: { totalAmount, totalCost, profitAmount, profitRate },
  };
}
