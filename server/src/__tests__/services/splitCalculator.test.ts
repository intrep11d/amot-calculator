import { Prisma } from '@prisma/client';
const { Decimal } = Prisma;
import { SplitType } from '../../types/enums';
import {
  calculateShares,
  validatePercentageSum,
  validatePercentageRange,
} from '../../services/splitCalculator';

describe('Split Calculator', () => {
  describe('calculateShares - EQUAL splits', () => {
    it('should split equally among 3 participants', () => {
      const splits = calculateShares(120, [
        { participantId: 'p1', splitType: SplitType.EQUAL },
        { participantId: 'p2', splitType: SplitType.EQUAL },
        { participantId: 'p3', splitType: SplitType.EQUAL },
      ]);

      expect(splits).toHaveLength(3);
      expect(splits[0].share.toFixed(2)).toBe('40.00');
      expect(splits[1].share.toFixed(2)).toBe('40.00');
      expect(splits[2].share.toFixed(2)).toBe('40.00');
    });

    it('should handle rounding with equal splits', () => {
      const splits = calculateShares(100, [
        { participantId: 'p1', splitType: SplitType.EQUAL },
        { participantId: 'p2', splitType: SplitType.EQUAL },
        { participantId: 'p3', splitType: SplitType.EQUAL },
      ]);

      // 100 / 3 = 33.33, 33.33, 33.34 (last person gets remainder)
      expect(splits[0].share.toFixed(2)).toBe('33.33');
      expect(splits[1].share.toFixed(2)).toBe('33.33');
      expect(splits[2].share.toFixed(2)).toBe('33.34');

      // Verify sum equals total
      const sum = splits.reduce((acc, s) => acc.add(s.share), new Decimal(0));
      expect(sum.toFixed(2)).toBe('100.00');
    });
  });

  describe('calculateShares - PERCENTAGE splits', () => {
    it('should calculate percentage splits correctly', () => {
      const splits = calculateShares(120, [
        { participantId: 'p1', splitType: SplitType.PERCENTAGE, percentage: 50 },
        { participantId: 'p2', splitType: SplitType.PERCENTAGE, percentage: 30 },
        { participantId: 'p3', splitType: SplitType.PERCENTAGE, percentage: 20 },
      ]);

      expect(splits[0].share.toFixed(2)).toBe('60.00');
      expect(splits[0].percentage?.toFixed(2)).toBe('50.00');
      expect(splits[1].share.toFixed(2)).toBe('36.00');
      expect(splits[1].percentage?.toFixed(2)).toBe('30.00');
      expect(splits[2].share.toFixed(2)).toBe('24.00');
      expect(splits[2].percentage?.toFixed(2)).toBe('20.00');
    });

    it('should throw if percentage is missing', () => {
      expect(() => {
        calculateShares(100, [
          { participantId: 'p1', splitType: SplitType.PERCENTAGE },
        ]);
      }).toThrow('must have a percentage');
    });
  });

  describe('calculateShares - EXACT splits', () => {
    it('should use exact amounts', () => {
      const splits = calculateShares(100, [
        { participantId: 'p1', splitType: SplitType.EXACT, share: 60 },
        { participantId: 'p2', splitType: SplitType.EXACT, share: 40 },
      ]);

      expect(splits[0].share.toFixed(2)).toBe('60.00');
      expect(splits[1].share.toFixed(2)).toBe('40.00');
    });

    it('should throw if share is missing', () => {
      expect(() => {
        calculateShares(100, [
          { participantId: 'p1', splitType: SplitType.EXACT },
        ]);
      }).toThrow('must have a share amount');
    });

    it('should throw if exact splits do not sum to total', () => {
      expect(() => {
        calculateShares(100, [
          { participantId: 'p1', splitType: SplitType.EXACT, share: 60 },
          { participantId: 'p2', splitType: SplitType.EXACT, share: 50 },
        ]);
      }).toThrow('Splits must sum to');
    });
  });

  describe('calculateShares - MIXED splits', () => {
    it('should handle EXACT + PERCENTAGE + EQUAL', () => {
      // Total: 200
      // EXACT: p1 gets 50
      // PERCENTAGE: p2 gets 20% of 200 = 40
      // EQUAL: p3 and p4 split remaining 110 equally (55 each)
      const splits = calculateShares(200, [
        { participantId: 'p1', splitType: SplitType.EXACT, share: 50 },
        { participantId: 'p2', splitType: SplitType.PERCENTAGE, percentage: 20 },
        { participantId: 'p3', splitType: SplitType.EQUAL },
        { participantId: 'p4', splitType: SplitType.EQUAL },
      ]);

      expect(splits.find((s) => s.participantId === 'p1')?.share.toFixed(2)).toBe('50.00');
      expect(splits.find((s) => s.participantId === 'p2')?.share.toFixed(2)).toBe('40.00');
      expect(splits.find((s) => s.participantId === 'p3')?.share.toFixed(2)).toBe('55.00');
      expect(splits.find((s) => s.participantId === 'p4')?.share.toFixed(2)).toBe('55.00');

      // Verify sum
      const sum = splits.reduce((acc, s) => acc.add(s.share), new Decimal(0));
      expect(sum.toFixed(2)).toBe('200.00');
    });

    it('should handle EXACT + EQUAL', () => {
      // Total: 100
      // EXACT: p1 gets 40
      // EQUAL: p2 and p3 split remaining 60 (30 each)
      const splits = calculateShares(100, [
        { participantId: 'p1', splitType: SplitType.EXACT, share: 40 },
        { participantId: 'p2', splitType: SplitType.EQUAL },
        { participantId: 'p3', splitType: SplitType.EQUAL },
      ]);

      expect(splits[0].share.toFixed(2)).toBe('40.00');
      expect(splits[1].share.toFixed(2)).toBe('30.00');
      expect(splits[2].share.toFixed(2)).toBe('30.00');
    });
  });

  describe('validatePercentageSum', () => {
    it('should return true when percentages sum to 100', () => {
      const splits = [
        { participantId: 'p1', splitType: SplitType.PERCENTAGE, percentage: 50 },
        { participantId: 'p2', splitType: SplitType.PERCENTAGE, percentage: 30 },
        { participantId: 'p3', splitType: SplitType.PERCENTAGE, percentage: 20 },
      ];
      expect(validatePercentageSum(splits)).toBe(true);
    });

    it('should return false when percentages do not sum to 100', () => {
      const splits = [
        { participantId: 'p1', splitType: SplitType.PERCENTAGE, percentage: 50 },
        { participantId: 'p2', splitType: SplitType.PERCENTAGE, percentage: 30 },
      ];
      expect(validatePercentageSum(splits)).toBe(false);
    });

    it('should return true when no percentage splits', () => {
      const splits = [
        { participantId: 'p1', splitType: SplitType.EQUAL },
      ];
      expect(validatePercentageSum(splits)).toBe(true);
    });
  });

  describe('validatePercentageRange', () => {
    it('should return true for valid percentages', () => {
      const splits = [
        { participantId: 'p1', splitType: SplitType.PERCENTAGE, percentage: 50 },
        { participantId: 'p2', splitType: SplitType.PERCENTAGE, percentage: 100 },
        { participantId: 'p3', splitType: SplitType.PERCENTAGE, percentage: 0 },
      ];
      expect(validatePercentageRange(splits)).toBe(true);
    });

    it('should return false for invalid percentages', () => {
      const splits = [
        { participantId: 'p1', splitType: SplitType.PERCENTAGE, percentage: 150 },
      ];
      expect(validatePercentageRange(splits)).toBe(false);
    });

    it('should return false for negative percentages', () => {
      const splits = [
        { participantId: 'p1', splitType: SplitType.PERCENTAGE, percentage: -10 },
      ];
      expect(validatePercentageRange(splits)).toBe(false);
    });
  });
});
