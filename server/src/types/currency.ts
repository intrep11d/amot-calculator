import { Prisma } from '@prisma/client';

export type CurrencyValue = number | string | Prisma.Decimal;

export interface CurrencyConfig {
  precision?: number;
  rounding?: Prisma.Decimal.Rounding;
}

export const DEFAULT_CURRENCY_CONFIG: CurrencyConfig = {
  precision: 2,
  rounding: Prisma.Decimal.ROUND_HALF_UP,
};
