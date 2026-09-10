import { api, setToken } from './client';
import type { User } from '../types';

interface AuthResponse {
  token: string;
  user: User;
}

export async function register(name: string, email: string, password: string): Promise<User> {
  const res = await api.post<AuthResponse>('/auth/register', { name, email, password });
  setToken(res.token);
  return res.user;
}

export async function login(email: string, password: string): Promise<User> {
  const res = await api.post<AuthResponse>('/auth/login', { email, password });
  setToken(res.token);
  return res.user;
}

export async function fetchMe(): Promise<User> {
  const res = await api.get<{ user: User }>('/auth/me');
  return res.user;
}

export function logout() {
  setToken(null);
}
