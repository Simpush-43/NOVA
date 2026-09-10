import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '../types';
import { getToken, setToken } from '../api/client';
import { fetchMe, login as apiLogin, logout as apiLogout, register as apiRegister } from '../api/auth';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!getToken()) {
        setIsLoading(false);
        return;
      }
      try {
        const me = await fetchMe();
        if (!cancelled) setUser(me);
      } catch {
        setToken(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    bootstrap();

    function handleUnauthorized() {
      setUser(null);
    }
    window.addEventListener('nova:unauthorized', handleUnauthorized);

    return () => {
      cancelled = true;
      window.removeEventListener('nova:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const loggedInUser = await apiLogin(email, password);
    setUser(loggedInUser);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const newUser = await apiRegister(name, email, password);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    apiLogout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider.');
  return ctx;
}
