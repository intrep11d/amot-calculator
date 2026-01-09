export interface Friend {
  id: string;
  name: string;
  friendCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    participants: number;
    items: number;
  };
}

export interface Participant {
  id: string;
  sessionId: string;
  friendId?: string | null;
  name: string;
  createdAt: string;
  friend?: Friend | null;
}

export interface ItemSplit {
  id: string;
  itemId: string;
  participantId: string;
  share: number;
  createdAt: string;
  participant: Participant;
}

export interface Item {
  id: string;
  sessionId: string;
  description: string;
  totalAmount: number;
  paidById: string;
  createdAt: string;
  paidBy: Participant;
  splits: ItemSplit[];
}

export interface SessionDetail extends Session {
  participants: Participant[];
  items: Item[];
}

export interface Debt {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
}

export interface ParticipantSummary {
  participantId: string;
  name: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
}

export interface Settlement {
  debts: Debt[];
  participantSummaries: ParticipantSummary[];
}

export interface CreateItemData {
  description: string;
  totalAmount: number;
  paidById: string;
  splits: {
    participantId: string;
    share: number;
  }[];
}

/**
 * Represents debt with a specific friend
 * - Positive amount: Friend owes you money
 * - Negative amount: You owe friend money
 */
export interface ByFriendDebt {
  friendId: string;
  friendName: string;
  amount: number;
}

/**
 * Represents net balance for a specific session
 * - Positive balance: You are owed money in this session
 * - Negative balance: You owe money in this session
 */
export interface BySessionBalance {
  sessionId: string;
  sessionName: string;
  balance: number;
}

export interface FriendBalance {
  netBalance: number;
  byFriend: ByFriendDebt[];
  bySession: BySessionBalance[];
}
