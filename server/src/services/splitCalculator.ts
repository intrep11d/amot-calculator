import { Prisma } from '@prisma/client';
const { Decimal } = Prisma;
import { SplitType } from '../types/enums';
import { SplitInput, CalculatedSplit } from '../types/requests';
import { CurrencyValue } from '../types/currency';
import {
  toDecimal,
  addCurrency,
  subtractCurrency,
  multiplyCurrency,
  divideCurrency,
  currencyEquals,
} from '../utils/currency';

/**
 * Calculate individual shares based on split types
 * Processes EXACT splits first, then PERCENTAGE, then EQUAL
 * Ensures total allocated equals the total amount
 */
export function calculateShares(
  totalAmount: CurrencyValue,
  splits: SplitInput[]
): CalculatedSplit[] {
  const total = toDecimal(totalAmount);
  let allocated = new Decimal(0);
  const result: CalculatedSplit[] = [];

  // 1. Process EXACT splits first
  const exactSplits = splits.filter((s) => s.splitType === SplitType.EXACT);
  for (const split of exactSplits) {
    if (!split.share) {
      throw new Error(
        `EXACT split for participant ${split.participantId} must have a share amount`
      );
    }
    const share = toDecimal(split.share);
    result.push({
      participantId: split.participantId,
      splitType: SplitType.EXACT,
      share,
    });
    allocated = addCurrency(allocated, share);
  }

  // 2. Process PERCENTAGE splits
  const percentageSplits = splits.filter(
    (s) => s.splitType === SplitType.PERCENTAGE
  );
  for (const split of percentageSplits) {
    if (!split.percentage) {
      throw new Error(
        `PERCENTAGE split for participant ${split.participantId} must have a percentage`
      );
    }
    const percentage = toDecimal(split.percentage);
    const share = toDecimal(
      multiplyCurrency(total, divideCurrency(percentage, 100))
    );
    result.push({
      participantId: split.participantId,
      splitType: SplitType.PERCENTAGE,
      share,
      percentage,
    });
    allocated = addCurrency(allocated, share);
  }

  // 3. Process EQUAL splits (divide remaining equally)
  const equalSplits = splits.filter((s) => s.splitType === SplitType.EQUAL);
  if (equalSplits.length > 0) {
    const remaining = subtractCurrency(total, allocated);
    const sharePerPerson = divideCurrency(remaining, equalSplits.length);

    // Allocate to all but last person
    for (let i = 0; i < equalSplits.length - 1; i++) {
      result.push({
        participantId: equalSplits[i].participantId,
        splitType: SplitType.EQUAL,
        share: sharePerPerson,
      });
      allocated = addCurrency(allocated, sharePerPerson);
    }

    // Last person gets the remainder to handle rounding
    const lastShare = subtractCurrency(total, allocated);
    result.push({
      participantId: equalSplits[equalSplits.length - 1].participantId,
      splitType: SplitType.EQUAL,
      share: lastShare,
    });
    allocated = addCurrency(allocated, lastShare);
  }

  // Validate total
  if (!currencyEquals(allocated, total)) {
    throw new Error(
      `Splits must sum to ${total.toFixed(2)}, but got ${allocated.toFixed(2)}`
    );
  }

  return result;
}

/**
 * Validate that percentage splits sum to 100%
 */
export function validatePercentageSum(splits: SplitInput[]): boolean {
  const percentageSplits = splits.filter(
    (s) => s.splitType === SplitType.PERCENTAGE
  );

  if (percentageSplits.length === 0) {
    return true;
  }

  const totalPercentage = percentageSplits.reduce(
    (sum, split) => addCurrency(sum, split.percentage || 0),
    new Decimal(0)
  );

  return currencyEquals(totalPercentage, 100);
}

/**
 * Check if all percentage splits have valid percentages (0-100)
 */
export function validatePercentageRange(splits: SplitInput[]): boolean {
  const percentageSplits = splits.filter(
    (s) => s.splitType === SplitType.PERCENTAGE
  );

  return percentageSplits.every((split) => {
    if (split.percentage === undefined || split.percentage === null) return false;
    const pct = toDecimal(split.percentage);
    return pct.greaterThanOrEqualTo(0) && pct.lessThanOrEqualTo(100);
  });
}
