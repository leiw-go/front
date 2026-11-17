import { describe, expect, it } from 'vitest';
import { priceLine, priceQuote, roundHalfUp, validateLine } from './pricing';

const baseLine = {
  productId: 'p1',
  productCode: 'SKU-001',
  productName: '测试产品',
  costPrice: 10,
  costCurrency: 'USD',
  moq: 10,
  onSale: true,
  quantity: 100,
};

describe('roundHalfUp', () => {
  it('按 HALF_UP 四舍五入', () => {
    expect(roundHalfUp(1.005, 2)).toBe(1.01);
    expect(roundHalfUp(1.0049, 2)).toBe(1);
    expect(roundHalfUp(12.3456789, 6)).toBe(12.345679);
  });

  it('负数远离 0', () => {
    expect(roundHalfUp(-1.005, 2)).toBe(-1.01);
  });
});

describe('priceLine', () => {
  it('按 成本 ×(1+加价)×(1−折扣) 计算单价与金额', () => {
    const line = priceLine(baseLine, {
      currency: 'USD',
      markupRate: 30,
      discountRate: 5,
    });

    expect(line.errors).toEqual([]);
    expect(line.unitPrice).toBe(12.35);
    expect(line.amount).toBe(1235);
    expect(line.lineCost).toBe(1000);
  });

  it('计算过程包含成本、加价、折扣、单价、金额五步', () => {
    const line = priceLine(baseLine, {
      currency: 'USD',
      markupRate: 30,
      discountRate: 5,
    });

    expect(line.steps.map((step) => step.title)).toEqual([
      '成本价',
      '加价',
      '折扣',
      '单价',
      '金额',
    ]);
    expect(line.steps[1].value).toBe(13);
    expect(line.steps[2].formula).toBe('× (1 − 5.00%)');
  });

  it('行加价率覆盖单头加价率', () => {
    const line = priceLine(
      { ...baseLine, markupRate: 10 },
      { currency: 'USD', markupRate: 30 },
    );

    expect(line.effectiveMarkupRate).toBe(10);
    expect(line.unitPrice).toBe(11);
  });

  it('手工改价的行跳过加价率与折扣率', () => {
    const line = priceLine(
      { ...baseLine, manualPrice: true, manualUnitPrice: 20 },
      { currency: 'USD', markupRate: 30, discountRate: 5 },
    );

    expect(line.unitPrice).toBe(20);
    expect(line.amount).toBe(2000);
    expect(line.steps.map((step) => step.title)).toEqual([
      '成本价',
      '手工单价',
      '金额',
    ]);
  });
});

describe('validateLine', () => {
  it('产品停售时报错', () => {
    expect(validateLine({ ...baseLine, onSale: false }, 'USD')).toContain(
      '产品已停售，不能报价',
    );
  });

  it('未维护成本价时报错', () => {
    expect(validateLine({ ...baseLine, costPrice: null }, 'USD')).toContain(
      '产品未维护成本价，不能参与报价',
    );
  });

  it('成本币种与报价币种不一致时报错', () => {
    expect(validateLine(baseLine, 'EUR')).toContain(
      '成本币种 USD 与报价币种 EUR 不一致',
    );
  });

  it('数量必须大于 0', () => {
    expect(validateLine({ ...baseLine, quantity: 0 }, 'USD')).toContain(
      '数量必须大于 0',
    );
  });

  it('数量低于起订量时报错', () => {
    expect(validateLine({ ...baseLine, quantity: 5 }, 'USD')).toContain(
      '数量低于起订量 MOQ 10',
    );
  });
});

describe('priceQuote', () => {
  it('汇总报价总额、成本汇总、毛利额与毛利率', () => {
    const { summary } = priceQuote([baseLine], {
      currency: 'USD',
      markupRate: 30,
      discountRate: 5,
    });

    expect(summary.totalAmount).toBe(1235);
    expect(summary.totalCost).toBe(1000);
    expect(summary.profitAmount).toBe(235);
    expect(summary.profitRate).toBe(19.03);
  });

  it('多行分别定价后汇总', () => {
    const { lines, summary } = priceQuote(
      [baseLine, { ...baseLine, quantity: 200 }],
      { currency: 'USD', markupRate: 30, discountRate: 5 },
    );

    expect(lines[1].amount).toBe(2470);
    expect(summary.totalAmount).toBe(3705);
    expect(summary.totalCost).toBe(3000);
    expect(summary.profitAmount).toBe(705);
  });

  it('报价总额为 0 时毛利率为 0', () => {
    const { summary } = priceQuote(
      [{ ...baseLine, manualPrice: true, manualUnitPrice: 0 }],
      { currency: 'USD', markupRate: 30 },
    );

    expect(summary.totalAmount).toBe(0);
    expect(summary.profitRate).toBe(0);
  });

  it('与后端 POST /quotations/calculate 实测结果一致', () => {
    // 对应后端两条真实产品：成本 10 / 10.5 USD，单头加价 30%、折扣 5%
    const { lines, summary } = priceQuote(
      [
        {
          productId: 'p1',
          costPrice: 10,
          costCurrency: 'USD',
          moq: 10,
          onSale: true,
          quantity: 100,
        },
        {
          productId: 'p2',
          costPrice: 10.5,
          costCurrency: 'USD',
          moq: 100,
          onSale: true,
          quantity: 200,
          markupRate: 10,
        },
      ],
      { currency: 'USD', markupRate: 30, discountRate: 5 },
    );

    expect(lines[0].unitPrice).toBe(12.35);
    expect(lines[0].amount).toBe(1235);
    expect(lines[1].unitPrice).toBe(10.9725);
    expect(lines[1].amount).toBe(2194.5);
    expect(summary.totalAmount).toBe(3429.5);
    expect(summary.totalCost).toBe(3100);
    expect(summary.profitAmount).toBe(329.5);
    expect(summary.profitRate).toBe(9.61);
  });

  it('手工改价行与后端一致', () => {
    const { lines, summary } = priceQuote(
      [{ ...baseLine, manualPrice: true, manualUnitPrice: 20 }],
      { currency: 'USD', markupRate: 30, discountRate: 5 },
    );

    expect(lines[0].unitPrice).toBe(20);
    expect(lines[0].amount).toBe(2000);
    expect(summary.totalCost).toBe(1000);
    expect(summary.profitAmount).toBe(1000);
    expect(summary.profitRate).toBe(50);
  });
});
