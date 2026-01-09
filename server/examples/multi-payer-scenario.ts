/**
 * Example: Multi-payer scenario
 *
 * Scenario: John, Matt, and Sarah go to dinner
 * - Total bill: $120
 * - John pays $80, Matt pays $40
 * - Split equally among all 3 ($40 each)
 *
 * Expected result:
 * - John: paid $80, owes $40 = net +$40 (owed)
 * - Matt: paid $40, owes $40 = net $0
 * - Sarah: paid $0, owes $40 = net -$40 (owes)
 *
 * Settlement: Sarah pays John $40
 */

import { Prisma } from '@prisma/client';
const { Decimal } = Prisma;
import prisma from '../src/prisma';
import { calculateNetBalances } from '../src/services/balanceCalculator';
import { simplifyDebts } from '../src/services/debtSimplifier';
import { SplitType } from '../src/types/enums';

async function multiPayerExample() {
  console.log('=== Multi-Payer Scenario ===\n');

  // 1. Create session
  const session = await prisma.session.create({
    data: { name: 'Friday Night Dinner' },
  });
  console.log(`Created session: ${session.name}`);

  // 2. Add participants
  const john = await prisma.participant.create({
    data: { sessionId: session.id, name: 'John' },
  });
  const matt = await prisma.participant.create({
    data: { sessionId: session.id, name: 'Matt' },
  });
  const sarah = await prisma.participant.create({
    data: { sessionId: session.id, name: 'Sarah' },
  });
  console.log('Created participants: John, Matt, Sarah');

  // 3. Create multi-payer item
  const item = await prisma.item.create({
    data: {
      sessionId: session.id,
      description: 'Dinner',
      totalAmount: new Decimal(120),
      paidById: null, // Multi-payer indicator
      payments: {
        create: [
          { participantId: john.id, amountPaid: new Decimal(80) },
          { participantId: matt.id, amountPaid: new Decimal(40) },
        ],
      },
      splits: {
        create: [
          { participantId: john.id, splitType: SplitType.EQUAL, share: new Decimal(40) },
          { participantId: matt.id, splitType: SplitType.EQUAL, share: new Decimal(40) },
          { participantId: sarah.id, splitType: SplitType.EQUAL, share: new Decimal(40) },
        ],
      },
    },
  });
  console.log(`\nCreated item: ${item.description} - $${item.totalAmount.toFixed(2)}`);
  console.log('Payers: John ($80), Matt ($40)');
  console.log('Split equally: $40 each\n');

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
  if (debts.length === 0) {
    console.log('  All settled!');
  } else {
    debts.forEach((debt) => {
      console.log(`  ${debt.fromName} pays ${debt.toName} $${debt.amount.toFixed(2)}`);
    });
  }

  // Cleanup
  await prisma.session.delete({ where: { id: session.id } });
  console.log('\n✓ Example completed successfully');
}

// Run if executed directly
if (require.main === module) {
  multiPayerExample()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

export default multiPayerExample;
