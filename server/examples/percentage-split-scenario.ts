/**
 * Example: Percentage split scenario
 *
 * Scenario: Team dinner where costs are split by percentage based on salary
 * - Total bill: $200
 * - Alice pays the full amount
 * - Split: Alice 40%, Bob 35%, Charlie 25%
 *
 * Expected result:
 * - Alice: paid $200, owes $80 (40%) = net +$120 (owed)
 * - Bob: paid $0, owes $70 (35%) = net -$70 (owes)
 * - Charlie: paid $0, owes $50 (25%) = net -$50 (owes)
 *
 * Settlement: Bob pays Alice $70, Charlie pays Alice $50
 */

import { Prisma } from '@prisma/client';
const { Decimal } = Prisma;
import prisma from '../src/prisma';
import { calculateShares } from '../src/services/splitCalculator';
import { calculateNetBalances } from '../src/services/balanceCalculator';
import { simplifyDebts } from '../src/services/debtSimplifier';
import { SplitType } from '../src/types/enums';

async function percentageSplitExample() {
  console.log('=== Percentage Split Scenario ===\n');

  // First, demonstrate split calculation
  console.log('Split calculation (40%, 35%, 25% of $200):');
  const splits = calculateShares(200, [
    { participantId: 'p1', splitType: SplitType.PERCENTAGE, percentage: 40 },
    { participantId: 'p2', splitType: SplitType.PERCENTAGE, percentage: 35 },
    { participantId: 'p3', splitType: SplitType.PERCENTAGE, percentage: 25 },
  ]);

  splits.forEach((split, index) => {
    const names = ['Alice', 'Bob', 'Charlie'];
    console.log(`  ${names[index]}: ${split.percentage?.toFixed(0)}% = $${split.share.toFixed(2)}`);
  });

  // 1. Create session
  const session = await prisma.session.create({
    data: { name: 'Team Dinner' },
  });
  console.log(`\nCreated session: ${session.name}`);

  // 2. Add participants
  const alice = await prisma.participant.create({
    data: { sessionId: session.id, name: 'Alice' },
  });
  const bob = await prisma.participant.create({
    data: { sessionId: session.id, name: 'Bob' },
  });
  const charlie = await prisma.participant.create({
    data: { sessionId: session.id, name: 'Charlie' },
  });
  console.log('Created participants: Alice, Bob, Charlie');

  // 3. Create item with percentage splits
  const item = await prisma.item.create({
    data: {
      sessionId: session.id,
      description: 'Team Dinner',
      totalAmount: new Decimal(200),
      paidById: alice.id, // Alice pays everything
      splits: {
        create: [
          {
            participantId: alice.id,
            splitType: SplitType.PERCENTAGE,
            share: new Decimal(80), // 40% of 200
            percentage: new Decimal(40),
          },
          {
            participantId: bob.id,
            splitType: SplitType.PERCENTAGE,
            share: new Decimal(70), // 35% of 200
            percentage: new Decimal(35),
          },
          {
            participantId: charlie.id,
            splitType: SplitType.PERCENTAGE,
            share: new Decimal(50), // 25% of 200
            percentage: new Decimal(25),
          },
        ],
      },
    },
  });
  console.log(`\nCreated item: ${item.description} - $${item.totalAmount.toFixed(2)}`);
  console.log('Payer: Alice ($200)');
  console.log('Split by percentage\n');

  // 4. Calculate balances
  const balances = await calculateNetBalances(session.id);

  console.log('Balances:');
  balances.forEach((balance) => {
    console.log(
      `  ${balance.participantName}: Paid $${balance.totalPaid.toFixed(2)}, ` +
      `Owes $${balance.totalOwed.toFixed(2)}, ` +
      `Net ${balance.netBalance.greaterThanOrEqualTo(0) ? '+' : ''}$${balance.netBalance.toFixed(2)}`
    );
  });

  // 5. Calculate simplified debts
  const debts = simplifyDebts(balances);

  console.log('\nSettlement:');
  debts.forEach((debt) => {
    console.log(`  ${debt.fromName} pays ${debt.toName} $${debt.amount.toFixed(2)}`);
  });

  // Cleanup
  await prisma.session.delete({ where: { id: session.id } });
  console.log('\n✓ Example completed successfully');
}

// Run if executed directly
if (require.main === module) {
  percentageSplitExample()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

export default percentageSplitExample;
