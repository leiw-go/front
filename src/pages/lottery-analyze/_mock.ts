import type { Request, Response } from 'express';

type CountItem = {
  periodA: number;
  periodB: number;
};

/** Generate random count in [1, 35] range */
function randCount(): number {
  return Math.floor(Math.random() * 35) + 1;
}

// 前区号码 01-35
const frontData: CountItem[] = [];
for (let i = 1; i <= 35; i += 1) {
  frontData.push({
    periodA: randCount(),
    periodB: randCount(),
  });
}

// 后区号码 B01-B12
const backData: CountItem[] = [];
for (let i = 1; i <= 12; i += 1) {
  const label = `B${String(i).padStart(2, '0')}`;
  backData.push({
    periodA: randCount(),
    periodB: randCount(),
  });
}

const lotteryChartData = {
  front: frontData,
  back: backData,
};

const getFakeLotteryData = (_: Request, res: Response) => {
  return res.json({
    code: 200,
    message: 'success',
    data: lotteryChartData,
    errors: null,
  });
};

export default {
  'GET  /api/lottery_analysis': getFakeLotteryData,
};
