import { Prisma } from '@prisma/client';

/**
 * Convert a Prisma Decimal to a number with 2 decimal places
 */
export function decimalToNumber(decimal: Prisma.Decimal | number | null | undefined): number {
  if (decimal === null || decimal === undefined) return 0;
  if (typeof decimal === 'number') return Number(decimal.toFixed(2));
  return Number(decimal.toFixed(2));
}

/**
 * Recursively serialize an object, converting all Decimal instances to numbers
 */
export function serializeDecimals<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  if (obj instanceof Prisma.Decimal) {
    return decimalToNumber(obj) as any;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => serializeDecimals(item)) as any;
  }

  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = serializeDecimals(obj[key]);
      }
    }
    return result;
  }

  return obj;
}
