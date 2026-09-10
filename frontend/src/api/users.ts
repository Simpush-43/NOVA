import { api } from './client';
import type { User } from '../types';

export async function searchUsers(query: string): Promise<User[]> {
  if (query.trim().length < 2) return [];
  const res = await api.get<{ users: User[] }>(`/users/search?q=${encodeURIComponent(query)}`);
  return res.users;
}
