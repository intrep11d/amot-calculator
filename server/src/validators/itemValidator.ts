import { Prisma } from '@prisma/client';
const { Decimal } = Prisma;
import { SplitType } from '../types/enums';
import { CreateItemRequest, ItemValidationResult } from '../types/requests';
import { toDecimal, addCurrency, currencyEquals } from '../utils/currency';
import {
  validatePercentageSum,
  validatePercentageRange,
} from '../services/splitCalculator';

/**
 * Validate item creation request
 */
export function validateCreateItem(
  request: CreateItemRequest
): ItemValidationResult {
  const errors: string[] = [];

  // 1. Validate description
  if (!request.description || request.description.trim().length === 0) {
    errors.push('Description is required');
  }

  // 2. Validate total amount
  const totalAmount = toDecimal(request.totalAmount);
  if (totalAmount.lessThanOrEqualTo(0)) {
    errors.push('Total amount must be positive');
  }

  // 3. Validate payment method (mutually exclusive)
  const hasSinglePayer = !!request.paidById;
  const hasMultiPayer = request.payments && request.payments.length > 0;

  if (!hasSinglePayer && !hasMultiPayer) {
    errors.push('Either paidById or payments must be provided');
  }

  if (hasSinglePayer && hasMultiPayer) {
    errors.push('Cannot specify both paidById and payments (use one or the other)');
  }

  // 4. Validate multi-payer sum
  if (hasMultiPayer && request.payments) {
    const paymentTotal = request.payments.reduce(
      (sum, p) => addCurrency(sum, p.amountPaid),
      new Decimal(0)
    );

    if (!currencyEquals(paymentTotal, totalAmount)) {
      errors.push(
        `Payments must sum to ${totalAmount.toFixed(2)}, but got ${paymentTotal.toFixed(2)}`
      );
    }

    // Check for duplicate participants in payments
    const paymentParticipantIds = request.payments.map((p) => p.participantId);
    const uniquePaymentIds = new Set(paymentParticipantIds);
    if (paymentParticipantIds.length !== uniquePaymentIds.size) {
      errors.push('Duplicate participants in payments');
    }

    // Validate each payment amount is positive
    for (const payment of request.payments) {
      const amount = toDecimal(payment.amountPaid);
      if (amount.lessThanOrEqualTo(0)) {
        errors.push(`Payment amount must be positive for participant ${payment.participantId}`);
      }
    }
  }

  // 5. Validate splits
  if (!request.splits || request.splits.length === 0) {
    errors.push('At least one split is required');
  } else {
    // Check for duplicate participants in splits
    const splitParticipantIds = request.splits.map((s) => s.participantId);
    const uniqueSplitIds = new Set(splitParticipantIds);
    if (splitParticipantIds.length !== uniqueSplitIds.size) {
      errors.push('Duplicate participants in splits');
    }

    // Validate EXACT splits have share
    for (const split of request.splits) {
      if (split.splitType === SplitType.EXACT) {
        if (split.share === undefined || split.share === null) {
          errors.push(
            `EXACT split for participant ${split.participantId} must have a share amount`
          );
        } else {
          const share = toDecimal(split.share);
          if (share.lessThanOrEqualTo(0)) {
            errors.push(
              `EXACT split share must be positive for participant ${split.participantId}`
            );
          }
        }
      }
    }

    // Validate PERCENTAGE splits have percentage
    for (const split of request.splits) {
      if (split.splitType === SplitType.PERCENTAGE) {
        if (split.percentage === undefined || split.percentage === null) {
          errors.push(
            `PERCENTAGE split for participant ${split.participantId} must have a percentage`
          );
        }
      }
    }

    // Validate percentage range (0-100)
    if (!validatePercentageRange(request.splits)) {
      errors.push('Percentage values must be between 0 and 100');
    }

    // Check if only percentage splits, they must sum to 100%
    const hasOnlyPercentageSplits = request.splits.every(
      (s) => s.splitType === SplitType.PERCENTAGE
    );
    if (hasOnlyPercentageSplits && !validatePercentageSum(request.splits)) {
      errors.push('When using only percentage splits, they must sum to 100%');
    }

    // Try to calculate shares (will throw if invalid)
    try {
      // Import here to avoid circular dependency
      const { calculateShares } = require('../services/splitCalculator');
      calculateShares(totalAmount, request.splits);
    } catch (error) {
      if (error instanceof Error) {
        errors.push(`Split calculation error: ${error.message}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate that a participant can be deleted
 */
export function validateDeleteParticipant(
  participantId: string,
  itemsPaidCount: number,
  itemSplitsCount: number
): ItemValidationResult {
  const errors: string[] = [];

  if (itemsPaidCount > 0) {
    errors.push(
      `Cannot delete participant: they are the payer for ${itemsPaidCount} item(s)`
    );
  }

  if (itemSplitsCount > 0) {
    errors.push(
      `Cannot delete participant: they have ${itemSplitsCount} item split(s)`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
