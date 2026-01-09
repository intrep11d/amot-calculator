import { Prisma } from '@prisma/client';
const { Decimal } = Prisma;
import { CurrencyValue, DEFAULT_CURRENCY_CONFIG } from '../types/currency';

/**
 * Convert a value to Decimal with proper precision for currency
 */
export function toDecimal(value: CurrencyValue): Prisma.Decimal {
  const { precision, rounding } = DEFAULT_CURRENCY_CONFIG;

  if (value instanceof Decimal) {
    return value.toDecimalPlaces(precision!, rounding!);
  }

  return new Decimal(value).toDecimalPlaces(precision!, rounding!);
}

/**
 * Add multiple currency amounts safely
 */
export function addCurrency(...amounts: CurrencyValue[]): Prisma.Decimal {
  return amounts.reduce<Prisma.Decimal>(
    (sum, amount) => sum.add(toDecimal(amount)),
    new Decimal(0)
  );
}

/**
 * Subtract currency amounts (a - b)
 */
export function subtractCurrency(a: CurrencyValue, b: CurrencyValue): Prisma.Decimal {
  return toDecimal(a).minus(toDecimal(b));
}

/**
 * Multiply currency amount by a factor
 */
export function multiplyCurrency(amount: CurrencyValue, factor: CurrencyValue): Prisma.Decimal {
  return toDecimal(amount).times(toDecimal(factor));
}

/**
 * Divide currency amount by a divisor
 */
export function divideCurrency(amount: CurrencyValue, divisor: CurrencyValue): Prisma.Decimal {
  const result = toDecimal(amount).dividedBy(toDecimal(divisor));
  return toDecimal(result);
}

/**
 * Compare two currency amounts with tolerance
 */
export function currencyEquals(
  a: CurrencyValue,
  b: CurrencyValue,
  tolerance: number = 0.01
): boolean {
  return toDecimal(a).minus(toDecimal(b)).abs().lessThanOrEqualTo(tolerance);
}

/**
 * Compare two currency amounts (returns -1, 0, or 1)
 */
export function compareCurrency(a: CurrencyValue, b: CurrencyValue): number {
  const aDecimal = toDecimal(a);
  const bDecimal = toDecimal(b);

  if (aDecimal.lessThan(bDecimal)) return -1;
  if (aDecimal.greaterThan(bDecimal)) return 1;
  return 0;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: CurrencyValue): string {
  return toDecimal(amount).toFixed(2);
}

/**
 * Check if amount is positive
 */
export function isPositive(amount: CurrencyValue): boolean {
  return toDecimal(amount).greaterThan(0);
}

/**
 * Check if amount is negative
 */
export function isNegative(amount: CurrencyValue): boolean {
  return toDecimal(amount).lessThan(0);
}

/**
 * Get absolute value
 */
export function absoluteValue(amount: CurrencyValue): Prisma.Decimal {
  return toDecimal(amount).abs();
}

/**
 * Get minimum of multiple amounts
 */
export function minCurrency(...amounts: CurrencyValue[]): Prisma.Decimal {
  const decimals = amounts.map(toDecimal);
  return Decimal.min(...decimals);
}

/**
 * Get maximum of multiple amounts
 */
export function maxCurrency(...amounts: CurrencyValue[]): Prisma.Decimal {
  const decimals = amounts.map(toDecimal);
  return Decimal.max(...decimals);
}
