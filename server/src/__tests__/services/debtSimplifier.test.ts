import { Prisma } from '@prisma/client';
const { Decimal } = Prisma;
import { ParticipantBalance } from '../../types/calculations';
import { simplifyDebts } from '../../services/debtSimplifier';

describe('Debt Simplifier', () => {
  describe('simplifyDebts', () => {
    it('should create one debt when one owes one', () => {
      const balances: ParticipantBalance[] = [
        {
          participantId: 'p1',
          participantName: 'Alice',
          friendId: 'f1',
          totalPaid: new Decimal(100),
          totalOwed: new Decimal(50),
          netBalance: new Decimal(50), // Alice is owed $50
        },
        {
          participantId: 'p2',
          participantName: 'Bob',
          friendId: 'f2',
          totalPaid: new Decimal(0),
          totalOwed: new Decimal(50),
          netBalance: new Decimal(-50), // Bob owes $50
        },
      ];

      const debts = simplifyDebts(balances);

      expect(debts).toHaveLength(1);
      expect(debts[0].fromName).toBe('Bob');
      expect(debts[0].toName).toBe('Alice');
      expect(debts[0].amount.toFixed(2)).toBe('50.00');
    });

    it('should handle multi-payer scenario (John-Matt-Sarah)', () => {
      // $120 dinner: John paid $80, Matt paid $40, split equally ($40 each)
      // John: paid $80, owes $40 = +$40 (owed)
      // Matt: paid $40, owes $40 = $0
      // Sarah: paid $0, owes $40 = -$40 (owes)
      const balances: ParticipantBalance[] = [
        {
          participantId: 'p1',
          participantName: 'John',
          friendId: 'f1',
          totalPaid: new Decimal(80),
          totalOwed: new Decimal(40),
          netBalance: new Decimal(40),
        },
        {
          participantId: 'p2',
          participantName: 'Matt',
          friendId: 'f2',
          totalPaid: new Decimal(40),
          totalOwed: new Decimal(40),
          netBalance: new Decimal(0),
        },
        {
          participantId: 'p3',
          participantName: 'Sarah',
          friendId: 'f3',
          totalPaid: new Decimal(0),
          totalOwed: new Decimal(40),
          netBalance: new Decimal(-40),
        },
      ];

      const debts = simplifyDebts(balances);

      expect(debts).toHaveLength(1);
      expect(debts[0].fromName).toBe('Sarah');
      expect(debts[0].toName).toBe('John');
      expect(debts[0].amount.toFixed(2)).toBe('40.00');
    });

    it('should simplify complex debts using greedy algorithm', () => {
      const balances: ParticipantBalance[] = [
        {
          participantId: 'p1',
          participantName: 'Alice',
          friendId: 'f1',
          totalPaid: new Decimal(100),
          totalOwed: new Decimal(40),
          netBalance: new Decimal(60), // Owed $60
        },
        {
          participantId: 'p2',
          participantName: 'Bob',
          friendId: 'f2',
          totalPaid: new Decimal(40),
          totalOwed: new Decimal(80),
          netBalance: new Decimal(-40), // Owes $40
        },
        {
          participantId: 'p3',
          participantName: 'Charlie',
          friendId: 'f3',
          totalPaid: new Decimal(20),
          totalOwed: new Decimal(40),
          netBalance: new Decimal(-20), // Owes $20
        },
      ];

      const debts = simplifyDebts(balances);

      // Alice is owed $60
      // Bob owes $40, Charlie owes $20
      // Greedy: Match Alice ($60) with Bob ($40) first
      // Then Alice (remaining $20) with Charlie ($20)
      expect(debts).toHaveLength(2);

      // Should have Bob -> Alice $40 and Charlie -> Alice $20
      const bobDebt = debts.find((d) => d.fromName === 'Bob');
      const charlieDebt = debts.find((d) => d.fromName === 'Charlie');

      expect(bobDebt?.toName).toBe('Alice');
      expect(bobDebt?.amount.toFixed(2)).toBe('40.00');
      expect(charlieDebt?.toName).toBe('Alice');
      expect(charlieDebt?.amount.toFixed(2)).toBe('20.00');
    });

    it('should minimize transactions with greedy matching', () => {
      const balances: ParticipantBalance[] = [
        {
          participantId: 'p1',
          participantName: 'Alice',
          friendId: null,
          totalPaid: new Decimal(150),
          totalOwed: new Decimal(100),
          netBalance: new Decimal(50),
        },
        {
          participantId: 'p2',
          participantName: 'Bob',
          friendId: null,
          totalPaid: new Decimal(100),
          totalOwed: new Decimal(150),
          netBalance: new Decimal(-50),
        },
      ];

      const debts = simplifyDebts(balances);

      // Should create just 1 transaction
      expect(debts).toHaveLength(1);
      expect(debts[0].fromName).toBe('Bob');
      expect(debts[0].toName).toBe('Alice');
      expect(debts[0].amount.toFixed(2)).toBe('50.00');
    });

    it('should ignore balances within tolerance', () => {
      const balances: ParticipantBalance[] = [
        {
          participantId: 'p1',
          participantName: 'Alice',
          friendId: null,
          totalPaid: new Decimal(100),
          totalOwed: new Decimal(100.005),
          netBalance: new Decimal(-0.005), // Within tolerance
        },
        {
          participantId: 'p2',
          participantName: 'Bob',
          friendId: null,
          totalPaid: new Decimal(100.005),
          totalOwed: new Decimal(100),
          netBalance: new Decimal(0.005), // Within tolerance
        },
      ];

      const debts = simplifyDebts(balances, 0.01);

      // Should create no debts (all within tolerance)
      expect(debts).toHaveLength(0);
    });

    it('should handle all zero balances', () => {
      const balances: ParticipantBalance[] = [
        {
          participantId: 'p1',
          participantName: 'Alice',
          friendId: null,
          totalPaid: new Decimal(100),
          totalOwed: new Decimal(100),
          netBalance: new Decimal(0),
        },
        {
          participantId: 'p2',
          participantName: 'Bob',
          friendId: null,
          totalPaid: new Decimal(50),
          totalOwed: new Decimal(50),
          netBalance: new Decimal(0),
        },
      ];

      const debts = simplifyDebts(balances);

      expect(debts).toHaveLength(0);
    });

    it('should handle multiple creditors and debtors', () => {
      const balances: ParticipantBalance[] = [
        {
          participantId: 'p1',
          participantName: 'Alice',
          friendId: null,
          totalPaid: new Decimal(100),
          totalOwed: new Decimal(25),
          netBalance: new Decimal(75), // Owed $75
        },
        {
          participantId: 'p2',
          participantName: 'Bob',
          friendId: null,
          totalPaid: new Decimal(50),
          totalOwed: new Decimal(25),
          netBalance: new Decimal(25), // Owed $25
        },
        {
          participantId: 'p3',
          participantName: 'Charlie',
          friendId: null,
          totalPaid: new Decimal(0),
          totalOwed: new Decimal(50),
          netBalance: new Decimal(-50), // Owes $50
        },
        {
          participantId: 'p4',
          participantName: 'David',
          friendId: null,
          totalPaid: new Decimal(0),
          totalOwed: new Decimal(50),
          netBalance: new Decimal(-50), // Owes $50
        },
      ];

      const debts = simplifyDebts(balances);

      // Total owed: $75 + $25 = $100
      // Total owes: $50 + $50 = $100
      // Should create 3 transactions (greedy matches largest first)
      expect(debts.length).toBeGreaterThan(0);

      // Verify total amounts balance
      const totalDebtAmount = debts.reduce(
        (sum, debt) => sum.add(debt.amount),
        new Decimal(0)
      );
      expect(totalDebtAmount.toFixed(2)).toBe('100.00');
    });
  });
});
