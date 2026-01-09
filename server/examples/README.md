# Amot Calculator Examples

This directory contains runnable examples demonstrating the enhanced bill splitting features.

## Running Examples

Make sure you have:
1. Database running (Supabase)
2. Environment variables set in `.env`
3. Prisma client generated (`npm run prisma:generate`)
4. Database schema pushed (`DATABASE_URL="<DIRECT_URL>" npx prisma db push`)

Run examples using ts-node:

```bash
cd server

# Multi-payer scenario
npx ts-node examples/multi-payer-scenario.ts

# Percentage split scenario
npx ts-node examples/percentage-split-scenario.ts

# Friend aggregation scenario
npx ts-node examples/friend-aggregation-scenario.ts

# Payment tracking scenario
npx ts-node examples/payment-tracking-scenario.ts
```

## Examples Overview

### 1. Multi-Payer Scenario (`multi-payer-scenario.ts`)

Demonstrates multiple people paying for a single item.

**Scenario**: John, Matt, and Sarah go to dinner
- Total: $120
- Payers: John ($80), Matt ($40)
- Split: Equally among all 3 ($40 each)

**Expected Result**: Sarah owes John $40

### 2. Percentage Split Scenario (`percentage-split-scenario.ts`)

Demonstrates splitting costs by percentage.

**Scenario**: Team dinner split by salary percentage
- Total: $200
- Payer: Alice (full amount)
- Split: Alice 40%, Bob 35%, Charlie 25%

**Expected Result**: Bob owes Alice $70, Charlie owes Alice $50

### 3. Friend Aggregation Scenario (`friend-aggregation-scenario.ts`)

Demonstrates friend-level debt aggregation across multiple sessions.

**Scenario**: Alice participates in multiple sessions
- Session 1 (Lunch): Bob owes Alice $20
- Session 2 (Dinner): Alice owes Bob $30

**Expected Result**: Net - Alice owes Bob $10

### 4. Payment Tracking Scenario (`payment-tracking-scenario.ts`)

Demonstrates creditor-controlled payment marking.

**Scenario**: Alice owes Bob $50 from session
- Alice pays Bob in cash
- Bob marks the debt as paid

**Expected Result**: Payment record created, settlement unchanged

## Key Features Demonstrated

- ✅ Multi-payer support (multiple people paying for one item)
- ✅ Percentage-based splits
- ✅ Equal splits
- ✅ Exact/custom splits
- ✅ Friend-level aggregation across sessions
- ✅ Payment tracking (creditor-controlled)
- ✅ Decimal precision (no floating-point errors)
- ✅ Greedy debt simplification algorithm

## Notes

- Examples automatically clean up after completion
- All currency calculations use `Decimal` type for precision
- Payment records are separate from settlement calculations
- Friend aggregation only works when participants have `friendId` set
