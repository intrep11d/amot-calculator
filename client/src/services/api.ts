import axios from 'axios';
import type {
  Session,
  SessionDetail,
  Participant,
  Item,
  Settlement,
  CreateItemData,
  Friend,
  FriendBalance,
  Group,
  GroupDetail,
  GroupMember,
} from '../types';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const sessionApi = {
  getAll: (groupId?: string) => {
    const url = groupId ? `/sessions?groupId=${groupId}` : '/sessions';
    return api.get<Session[]>(url);
  },
  getById: (id: string) => api.get<SessionDetail>(`/sessions/${id}`),
  create: (name: string, groupId?: string) =>
    api.post<Session>('/sessions', { name, groupId }),
  delete: (id: string) => api.delete(`/sessions/${id}`),
};

export const participantApi = {
  getAll: (sessionId: string) =>
    api.get<Participant[]>(`/sessions/${sessionId}/participants`),
  create: (sessionId: string, data: { name?: string; friendCode?: string }) =>
    api.post<Participant>(`/sessions/${sessionId}/participants`, data),
  delete: (id: string) => api.delete(`/participants/${id}`),
};

export const itemApi = {
  getAll: (sessionId: string) => api.get<Item[]>(`/sessions/${sessionId}/items`),
  create: (sessionId: string, data: CreateItemData) =>
    api.post<Item>(`/sessions/${sessionId}/items`, data),
  update: (id: string, data: CreateItemData) =>
    api.put<Item>(`/items/${id}`, data),
  delete: (id: string) => api.delete(`/items/${id}`),
};

export const settlementApi = {
  get: (sessionId: string) =>
    api.get<Settlement>(`/sessions/${sessionId}/settlements`),
};

export const friendApi = {
  create: (name: string) => api.post<Friend>('/friends', { name }),
  getByCode: (friendCode: string) => api.get<Friend>(`/friends/${friendCode}`),
  update: (friendCode: string, name: string) =>
    api.put<Friend>(`/friends/${friendCode}`, { name }),
  getBalance: (friendCode: string) =>
    api.get<FriendBalance>(`/friends/${friendCode}/balance`),
};

export const groupApi = {
  getAll: () => api.get<Group[]>('/groups'),
  getById: (id: string) => api.get<GroupDetail>(`/groups/${id}`),
  create: (name: string) => api.post<Group>('/groups', { name }),
  update: (id: string, name: string) => api.put<Group>(`/groups/${id}`, { name }),
  delete: (id: string) => api.delete(`/groups/${id}`),
  getMembers: (groupId: string) => api.get<GroupMember[]>(`/groups/${groupId}/members`),
  addMember: (groupId: string, friendCode: string) =>
    api.post<GroupMember>(`/groups/${groupId}/members`, { friendCode }),
  removeMember: (groupId: string, memberId: string) =>
    api.delete(`/groups/${groupId}/members/${memberId}`),
};
