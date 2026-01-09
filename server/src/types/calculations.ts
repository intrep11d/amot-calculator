import { Prisma } from '@prisma/client';

export interface ParticipantBalance {
  participantId: string;
  participantName: string;
  friendId: string | null;
  totalPaid: Prisma.Decimal;
  totalOwed: Prisma.Decimal;
  netBalance: Prisma.Decimal;
}

export interface Debt {
  fromParticipantId: string;
  fromName: string;
  fromFriendId: string | null;
  toParticipantId: string;
  toName: string;
  toFriendId: string | null;
  amount: Prisma.Decimal;
}

export interface SessionDebtBreakdown {
  sessionId: string;
  sessionName: string;
  amount: Prisma.Decimal;
}

export interface FriendDebt {
  fromFriendId: string;
  fromFriendName: string;
  toFriendId: string;
  toFriendName: string;
  amount: Prisma.Decimal;
  sessionBreakdown: SessionDebtBreakdown[];
}

export interface FriendSettlement {
  friendId: string;
  friendName: string;
  netBalance: Prisma.Decimal;
  owesTo: FriendDebt[];
  owedBy: FriendDebt[];
  totalOwed: Prisma.Decimal;
  totalOwedBy: Prisma.Decimal;
}
