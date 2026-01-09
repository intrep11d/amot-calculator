import { Prisma } from '@prisma/client';
const { Decimal } = Prisma;
import {
  toDecimal,
  addCurrency,
  subtractCurrency,
  multiplyCurrency,
  divideCurrency,
  currencyEquals,
  compareCurrency,
  formatCurrency,
  isPositive,
  isNegative,
  absoluteValue,
  minCurrency,
  maxCurrency,
} from '../../utils/currency';

describe('Currency Utilities', () => {
  describe('toDecimal', () => {
    it('should convert number to Decimal with 2 decimal places', () => {
      const result = toDecimal(10.123456);
      expect(result.toFixed(2)).toBe('10.12');
    });

    it('should convert string to Decimal', () => {
      const result = toDecimal('25.50');
      expect(result.toFixed(2)).toBe('25.50');
    });

    it('should handle Decimal input', () => {
      const input = new Decimal(100.999);
      const result = toDecimal(input);
      expect(result.toFixed(2)).toBe('101.00');
    });

    it('should round using ROUND_HALF_UP', () => {
      const result = toDecimal(10.125);
      expect(result.toFixed(2)).toBe('10.13');
    });
  });

  describe('addCurrency', () => {
    it('should add two numbers correctly', () => {
      const result = addCurrency(10.5, 20.3);
      expect(result.toFixed(2)).toBe('30.80');
    });

    it('should handle floating-point precision issues', () => {
      const result = addCurrency(0.1, 0.2);
      expect(result.toFixed(2)).toBe('0.30');
    });

    it('should add multiple amounts', () => {
      const result = addCurrency(10, 20, 30, 40.50);
      expect(result.toFixed(2)).toBe('100.50');
    });

    it('should handle Decimal inputs', () => {
      const result = addCurrency(new Decimal(10), new Decimal(20));
      expect(result.toFixed(2)).toBe('30.00');
    });
  });

  describe('subtractCurrency', () => {
    it('should subtract correctly', () => {
      const result = subtractCurrency(50.75, 20.25);
      expect(result.toFixed(2)).toBe('30.50');
    });

    it('should handle negative results', () => {
      const result = subtractCurrency(10, 20);
      expect(result.toFixed(2)).toBe('-10.00');
    });

    it('should handle floating-point precision', () => {
      const result = subtractCurrency(0.3, 0.1);
      expect(result.toFixed(2)).toBe('0.20');
    });
  });

  describe('multiplyCurrency', () => {
    it('should multiply correctly', () => {
      const result = multiplyCurrency(10, 2.5);
      expect(result.toFixed(2)).toBe('25.00');
    });

    it('should handle decimals', () => {
      const result = multiplyCurrency(100, 0.15);
      expect(result.toFixed(2)).toBe('15.00');
    });
  });

  describe('divideCurrency', () => {
    it('should divide correctly', () => {
      const result = divideCurrency(100, 4);
      expect(result.toFixed(2)).toBe('25.00');
    });

    it('should handle division with remainder', () => {
      const result = divideCurrency(100, 3);
      expect(result.toFixed(2)).toBe('33.33');
    });

    it('should round to 2 decimal places', () => {
      const result = divideCurrency(10, 3);
      expect(result.toFixed(2)).toBe('3.33');
    });
  });

  describe('currencyEquals', () => {
    it('should return true for equal amounts', () => {
      expect(currencyEquals(10.00, 10.00)).toBe(true);
    });

    it('should return true within tolerance', () => {
      expect(currencyEquals(10.00, 10.005, 0.01)).toBe(true);
    });

    it('should return false outside tolerance', () => {
      expect(currencyEquals(10.00, 10.02, 0.01)).toBe(false);
    });

    it('should handle floating-point comparison', () => {
      const a = addCurrency(0.1, 0.2);
      expect(currencyEquals(a, 0.3)).toBe(true);
    });
  });

  describe('compareCurrency', () => {
    it('should return -1 when a < b', () => {
      expect(compareCurrency(10, 20)).toBe(-1);
    });

    it('should return 1 when a > b', () => {
      expect(compareCurrency(20, 10)).toBe(1);
    });

    it('should return 0 when a === b', () => {
      expect(compareCurrency(10, 10)).toBe(0);
    });
  });

  describe('formatCurrency', () => {
    it('should format to 2 decimal places', () => {
      expect(formatCurrency(10)).toBe('10.00');
      expect(formatCurrency(10.5)).toBe('10.50');
      expect(formatCurrency(10.123)).toBe('10.12');
    });
  });

  describe('isPositive', () => {
    it('should return true for positive amounts', () => {
      expect(isPositive(10)).toBe(true);
      expect(isPositive(0.01)).toBe(true);
    });

    it('should return false for zero and negative', () => {
      expect(isPositive(0)).toBe(false);
      expect(isPositive(-10)).toBe(false);
    });
  });

  describe('isNegative', () => {
    it('should return true for negative amounts', () => {
      expect(isNegative(-10)).toBe(true);
      expect(isNegative(-0.01)).toBe(true);
    });

    it('should return false for zero and positive', () => {
      expect(isNegative(0)).toBe(false);
      expect(isNegative(10)).toBe(false);
    });
  });

  describe('absoluteValue', () => {
    it('should return positive value', () => {
      expect(absoluteValue(-10).toFixed(2)).toBe('10.00');
      expect(absoluteValue(10).toFixed(2)).toBe('10.00');
    });
  });

  describe('minCurrency', () => {
    it('should return minimum value', () => {
      const result = minCurrency(10, 20, 5, 15);
      expect(result.toFixed(2)).toBe('5.00');
    });
  });

  describe('maxCurrency', () => {
    it('should return maximum value', () => {
      const result = maxCurrency(10, 20, 5, 15);
      expect(result.toFixed(2)).toBe('20.00');
    });
  });
});
