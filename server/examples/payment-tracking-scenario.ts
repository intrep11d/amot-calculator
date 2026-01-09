/**
 * Example: Payment tracking scenario
 *
 * Scenario: After settling debts, creditor marks payment as received
 * - Alice owes Bob $50 from previous sessions
 * - Bob (creditor) marks the debt as paid after Alice pays him
 */

import prisma from '../src/prisma';
import { calculateFriendSettlement } from '../src/services/friendAggregator';
import { markDebtAsPaid, getFriendPaymentRecords } from '../src/services/paymentTracker';
import { Prisma } from '@prisma/client';
const { Decimal } = Prisma;
import { SplitType } from '../src/types/enums';

async function paymentTrackingExample() {
  console.log('=== Payment Tracking Scenario ===\n');

  // 1. Create friends
  const alice = await prisma.friend.create({
    data: { name: 'Alice' },
  });
  const bob = await prisma.friend.create({
    data: { name: 'Bob' },
  });
  console.log('Created friends: Alice, Bob\n');

  // 2. Create session where Alice owes Bob
  console.log('Creating session...');
  const session = await prisma.session.create({
    data: { name: 'Movie Night' },
  });

  const aliceParticipant = await prisma.participant.create({
    data: { sessionId: session.id, name: 'Alice', friendId: alice.id },
  });
  const bobParticipant = await prisma.participant.create({
    data: { sessionId: session.id, name: 'Bob', friendId: bob.id },
  });

  await prisma.item.create({
    data: {
      sessionId: session.id,
      description: 'Movie tickets',
      totalAmount: new Decimal(100),
      paidById: bobParticipant.id,
      splits: {
        create: [
          { participantId: aliceParticipant.id, splitType: SplitType.EQUAL, share: new Decimal(50) },
          { participantId: bobParticipant.id, splitType: SplitType.EQUAL, share: new Decimal(50) },
        ],
      },
    },
  });
  console.log('  Bob paid $100 for movie tickets, split equally');
  console.log('  → Alice owes Bob $50\n');

  // 3. Check Alice's settlement before payment
  console.log('=== Before Payment ===');
  let aliceSettlement = await calculateFriendSettlement(alice.id);

  console.log(`Alice's net balance: ${aliceSettlement.netBalance.greaterThanOrEqualTo(0) ? '+' : ''}$${aliceSettlement.netBalance.toFixed(2)}`);
  if (aliceSettlement.owesTo.length > 0) {
    console.log('Alice owes:');
    aliceSettlement.owesTo.forEach((debt) => {
      console.log(`  ${debt.toFriendName}: $${debt.amount.toFixed(2)}`);
    });
  }

  // 4. Alice pays Bob in real life, Bob marks it as paid
  console.log('\n=== Payment Transaction ===');
  console.log('Alice pays Bob $50 in cash...');

  const paymentRecord = await markDebtAsPaid(
    bob.id,        // creditor (Bob)
    alice.id,      // debtor (Alice)
    50,            // amount
    'Cash payment for movie tickets'
  );

  console.log(`✓ Bob marked payment as received`);
  console.log(`  Payment ID: ${paymentRecord.id}`);
  console.log(`  Amount: $${paymentRecord.amount.toFixed(2)}`);
  console.log(`  Note: ${paymentRecord.note}`);
  console.log(`  Marked at: ${paymentRecord.markedPaidAt.toISOString()}\n`);

  // 5. View payment records
  console.log('=== Payment Records ===');

  const bobRecords = await getFriendPaymentRecords(bob.id);
  console.log(`Bob's payment records:`);
  console.log(`  Marked by Bob (as creditor): ${bobRecords.paymentsMarkedByMe.length} payment(s)`);
  bobRecords.paymentsMarkedByMe.forEach((record) => {
    console.log(`    - $${record.amount.toFixed(2)} from ${record.debtor.name} (${record.note})`);
  });

  const aliceRecords = await getFriendPaymentRecords(alice.id);
  console.log(`\nAlice's payment records:`);
  console.log(`  Marked for Alice (as debtor): ${aliceRecords.paymentsMarkedForMe.length} payment(s)`);
  aliceRecords.paymentsMarkedForMe.forEach((record) => {
    console.log(`    - $${record.amount.toFixed(2)} to ${record.creditor.name} (${record.note})`);
  });

  // Note: Payment records are separate from settlement calculations
  // The session debt still exists - payment records are for tracking only
  console.log('\n=== Note ===');
  console.log('Payment records track real-world payments but do not modify session debts.');
  console.log('Session settlements remain unchanged and reflect the original transaction history.');

  // Cleanup
  await prisma.paymentRecord.delete({ where: { id: paymentRecord.id } });
  await prisma.session.delete({ where: { id: session.id } });
  await prisma.friend.deleteMany({
    where: { id: { in: [alice.id, bob.id] } },
  });

  console.log('\n✓ Example completed successfully');
}

// Run if executed directly
if (require.main === module) {
  paymentTrackingExample()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

export default paymentTrackingExample;
