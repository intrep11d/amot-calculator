/**
 * Example: Friend-level aggregation across sessions
 *
 * Scenario: Alice participates in multiple sessions with different people
 * Calculate Alice's total debts/credits across all sessions
 *
 * Session 1: Alice, Bob - Lunch $40
 * - Alice pays $40, both split equally ($20 each)
 * - Bob owes Alice $20
 *
 * Session 2: Alice, Bob, Charlie - Dinner $90
 * - Bob pays $90, split equally ($30 each)
 * - Alice owes Bob $30, Charlie owes Bob $30
 *
 * Net for Alice: Bob owed her $20, now she owes Bob $30
 * Final: Alice owes Bob $10
 */

import { Prisma } from '@prisma/client';
const { Decimal } = Prisma;
import prisma from '../src/prisma';
import { calculateFriendSettlement } from '../src/services/friendAggregator';
import { SplitType } from '../src/types/enums';

async function friendAggregationExample() {
  console.log('=== Friend Aggregation Scenario ===\n');

  // 1. Create friends
  const alice = await prisma.friend.create({
    data: { name: 'Alice' },
  });
  const bob = await prisma.friend.create({
    data: { name: 'Bob' },
  });
  const charlie = await prisma.friend.create({
    data: { name: 'Charlie' },
  });
  console.log('Created friends: Alice, Bob, Charlie\n');

  // === Session 1: Lunch ===
  console.log('Session 1: Lunch ($40)');
  const session1 = await prisma.session.create({
    data: { name: 'Lunch' },
  });

  const alice1 = await prisma.participant.create({
    data: { sessionId: session1.id, name: 'Alice', friendId: alice.id },
  });
  const bob1 = await prisma.participant.create({
    data: { sessionId: session1.id, name: 'Bob', friendId: bob.id },
  });

  await prisma.item.create({
    data: {
      sessionId: session1.id,
      description: 'Lunch',
      totalAmount: new Decimal(40),
      paidById: alice1.id,
      splits: {
        create: [
          { participantId: alice1.id, splitType: SplitType.EQUAL, share: new Decimal(20) },
          { participantId: bob1.id, splitType: SplitType.EQUAL, share: new Decimal(20) },
        ],
      },
    },
  });
  console.log('  Alice paid $40, split equally');
  console.log('  → Bob owes Alice $20\n');

  // === Session 2: Dinner ===
  console.log('Session 2: Dinner ($90)');
  const session2 = await prisma.session.create({
    data: { name: 'Dinner' },
  });

  const alice2 = await prisma.participant.create({
    data: { sessionId: session2.id, name: 'Alice', friendId: alice.id },
  });
  const bob2 = await prisma.participant.create({
    data: { sessionId: session2.id, name: 'Bob', friendId: bob.id },
  });
  const charlie2 = await prisma.participant.create({
    data: { sessionId: session2.id, name: 'Charlie', friendId: charlie.id },
  });

  await prisma.item.create({
    data: {
      sessionId: session2.id,
      description: 'Dinner',
      totalAmount: new Decimal(90),
      paidById: bob2.id,
      splits: {
        create: [
          { participantId: alice2.id, splitType: SplitType.EQUAL, share: new Decimal(30) },
          { participantId: bob2.id, splitType: SplitType.EQUAL, share: new Decimal(30) },
          { participantId: charlie2.id, splitType: SplitType.EQUAL, share: new Decimal(30) },
        ],
      },
    },
  });
  console.log('  Bob paid $90, split equally among 3');
  console.log('  → Alice owes Bob $30');
  console.log('  → Charlie owes Bob $30\n');

  // Calculate Alice's friend-level settlement
  console.log('=== Alice\'s Aggregated Settlement ===\n');
  const aliceSettlement = await calculateFriendSettlement(alice.id);

  console.log(`Total owed by Alice: $${aliceSettlement.totalOwed.toFixed(2)}`);
  console.log(`Total owed to Alice: $${aliceSettlement.totalOwedBy.toFixed(2)}`);
  console.log(`Net balance: ${aliceSettlement.netBalance.greaterThanOrEqualTo(0) ? '+' : ''}$${aliceSettlement.netBalance.toFixed(2)}\n`);

  if (aliceSettlement.owesTo.length > 0) {
    console.log('Alice owes:');
    aliceSettlement.owesTo.forEach((debt) => {
      console.log(`  ${debt.toFriendName}: $${debt.amount.toFixed(2)}`);
      console.log('  Breakdown:');
      debt.sessionBreakdown.forEach((sb) => {
        console.log(`    ${sb.sessionName}: $${sb.amount.toFixed(2)}`);
      });
    });
  }

  if (aliceSettlement.owedBy.length > 0) {
    console.log('\nAlice is owed by:');
    aliceSettlement.owedBy.forEach((debt) => {
      console.log(`  ${debt.fromFriendName}: $${debt.amount.toFixed(2)}`);
      console.log('  Breakdown:');
      debt.sessionBreakdown.forEach((sb) => {
        console.log(`    ${sb.sessionName}: $${sb.amount.toFixed(2)}`);
      });
    });
  }

  // Cleanup
  await prisma.session.deleteMany({
    where: { id: { in: [session1.id, session2.id] } },
  });
  await prisma.friend.deleteMany({
    where: { id: { in: [alice.id, bob.id, charlie.id] } },
  });

  console.log('\n✓ Example completed successfully');
}

// Run if executed directly
if (require.main === module) {
  friendAggregationExample()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}

export default friendAggregationExample;
