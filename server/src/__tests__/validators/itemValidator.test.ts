import { SplitType } from '../../types/enums';
import { CreateItemRequest } from '../../types/requests';
import { validateCreateItem } from '../../validators/itemValidator';

describe('Item Validator', () => {
  describe('validateCreateItem', () => {
    it('should validate a valid single-payer item', () => {
      const request: CreateItemRequest = {
        sessionId: 's1',
        description: 'Dinner',
        totalAmount: 100,
        paidById: 'p1',
        splits: [
          { participantId: 'p1', splitType: SplitType.EXACT, share: 50 },
          { participantId: 'p2', splitType: SplitType.EXACT, share: 50 },
        ],
      };

      const result = validateCreateItem(request);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a valid multi-payer item', () => {
      const request: CreateItemRequest = {
        sessionId: 's1',
        description: 'Dinner',
        totalAmount: 120,
        payments: [
          { participantId: 'p1', amountPaid: 80 },
          { participantId: 'p2', amountPaid: 40 },
        ],
        splits: [
          { participantId: 'p1', splitType: SplitType.EQUAL },
          { participantId: 'p2', splitType: SplitType.EQUAL },
          { participantId: 'p3', splitType: SplitType.EQUAL },
        ],
      };

      const result = validateCreateItem(request);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty description', () => {
      const request: CreateItemRequest = {
        sessionId: 's1',
        description: '',
        totalAmount: 100,
        paidById: 'p1',
        splits: [{ participantId: 'p1', splitType: SplitType.EXACT, share: 100 }],
      };

      const result = validateCreateItem(request);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Description is required');
    });

    it('should reject zero or negative total amount', () => {
      const request: CreateItemRequest = {
        sessionId: 's1',
        description: 'Item',
        totalAmount: 0,
        paidById: 'p1',
        splits: [{ participantId: 'p1', splitType: SplitType.EXACT, share: 0 }],
      };

      const result = validateCreateItem(request);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Total amount must be positive');
    });

    it('should reject when both paidById and payments are provided', () => {
      const request: CreateItemRequest = {
        sessionId: 's1',
        description: 'Item',
        totalAmount: 100,
        paidById: 'p1',
        payments: [{ participantId: 'p1', amountPaid: 100 }],
        splits: [{ participantId: 'p1', splitType: SplitType.EXACT, share: 100 }],
      };

      const result = validateCreateItem(request);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cannot specify both paidById and payments (use one or the other)');
    });

    it('should reject when neither paidById nor payments are provided', () => {
      const request: CreateItemRequest = {
        sessionId: 's1',
        description: 'Item',
        totalAmount: 100,
        splits: [{ participantId: 'p1', splitType: SplitType.EXACT, share: 100 }],
      };

      const result = validateCreateItem(request);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Either paidById or payments must be provided');
    });

    it('should reject when payments do not sum to total', () => {
      const request: CreateItemRequest = {
        sessionId: 's1',
        description: 'Item',
        totalAmount: 100,
        payments: [
          { participantId: 'p1', amountPaid: 60 },
          { participantId: 'p2', amountPaid: 30 }, // Total: 90, not 100
        ],
        splits: [{ participantId: 'p1', splitType: SplitType.EXACT, share: 100 }],
      };

      const result = validateCreateItem(request);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Payments must sum to'))).toBe(true);
    });

    it('should reject duplicate participants in payments', () => {
      const request: CreateItemRequest = {
        sessionId: 's1',
        description: 'Item',
        totalAmount: 100,
        payments: [
          { participantId: 'p1', amountPaid: 50 },
          { participantId: 'p1', amountPaid: 50 }, // Duplicate
        ],
        splits: [{ participantId: 'p1', splitType: SplitType.EXACT, share: 100 }],
      };

      const result = validateCreateItem(request);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Duplicate participants in payments');
    });

    it('should reject negative payment amounts', () => {
      const request: CreateItemRequest = {
        sessionId: 's1',
        description: 'Item',
        totalAmount: 100,
        payments: [{ participantId: 'p1', amountPaid: -50 }],
        splits: [{ participantId: 'p1', splitType: SplitType.EXACT, share: 100 }],
      };

      const result = validateCreateItem(request);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Payment amount must be positive'))).toBe(true);
    });

    it('should reject when no splits provided', () => {
      const request: CreateItemRequest = {
        sessionId: 's1',
        description: 'Item',
        totalAmount: 100,
        paidById: 'p1',
        splits: [],
      };

      const result = validateCreateItem(request);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('At least one split is required');
    });

    it('should reject duplicate participants in splits', () => {
      const request: CreateItemRequest = {
        sessionId: 's1',
        description: 'Item',
        totalAmount: 100,
        paidById: 'p1',
        splits: [
          { participantId: 'p1', splitType: SplitType.EXACT, share: 50 },
          { participantId: 'p1', splitType: SplitType.EXACT, share: 50 }, // Duplicate
        ],
      };

      const result = validateCreateItem(request);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Duplicate participants in splits');
    });

    it('should reject EXACT split without share', () => {
      const request: CreateItemRequest = {
        sessionId: 's1',
        description: 'Item',
        totalAmount: 100,
        paidById: 'p1',
        splits: [{ participantId: 'p1', splitType: SplitType.EXACT }],
      };

      const result = validateCreateItem(request);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('must have a share amount'))).toBe(true);
    });

    it('should reject PERCENTAGE split without percentage', () => {
      const request: CreateItemRequest = {
        sessionId: 's1',
        description: 'Item',
        totalAmount: 100,
        paidById: 'p1',
        splits: [{ participantId: 'p1', splitType: SplitType.PERCENTAGE }],
      };

      const result = validateCreateItem(request);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('must have a percentage'))).toBe(true);
    });

    it('should reject invalid percentage range', () => {
      const request: CreateItemRequest = {
        sessionId: 's1',
        description: 'Item',
        totalAmount: 100,
        paidById: 'p1',
        splits: [
          { participantId: 'p1', splitType: SplitType.PERCENTAGE, percentage: 150 },
        ],
      };

      const result = validateCreateItem(request);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Percentage values must be between 0 and 100');
    });

    it('should reject percentage splits that do not sum to 100%', () => {
      const request: CreateItemRequest = {
        sessionId: 's1',
        description: 'Item',
        totalAmount: 100,
        paidById: 'p1',
        splits: [
          { participantId: 'p1', splitType: SplitType.PERCENTAGE, percentage: 50 },
          { participantId: 'p2', splitType: SplitType.PERCENTAGE, percentage: 30 },
        ],
      };

      const result = validateCreateItem(request);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('When using only percentage splits, they must sum to 100%');
    });

    it('should accept mixed split types', () => {
      const request: CreateItemRequest = {
        sessionId: 's1',
        description: 'Item',
        totalAmount: 100,
        paidById: 'p1',
        splits: [
          { participantId: 'p1', splitType: SplitType.EXACT, share: 30 },
          { participantId: 'p2', splitType: SplitType.PERCENTAGE, percentage: 20 },
          { participantId: 'p3', splitType: SplitType.EQUAL },
          { participantId: 'p4', splitType: SplitType.EQUAL },
        ],
      };

      const result = validateCreateItem(request);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject negative share amounts', () => {
      const request: CreateItemRequest = {
        sessionId: 's1',
        description: 'Item',
        totalAmount: 100,
        paidById: 'p1',
        splits: [{ participantId: 'p1', splitType: SplitType.EXACT, share: -50 }],
      };

      const result = validateCreateItem(request);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('share must be positive'))).toBe(true);
    });
  });
});
