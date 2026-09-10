import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './Avatar';
import { NovaMark } from '../pages/AuthPage';

export function Layout({ children, right }: { children: ReactNode; right?: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--color-paper)]">
      <header className="sticky top-0 z-20 border-b border-[var(--color-line)] bg-[var(--color-paper)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <Link to="/" className="flex items-center gap-2.5">
            <NovaMark size={26} />
            <span className="font-display text-lg font-semibold tracking-tight text-[var(--color-ink)]">NOVA</span>
          </Link>

          <div className="flex items-center gap-4">
            {right}
            {user && (
              <div className="flex items-center gap-2.5 border-l border-[var(--color-line)] pl-4">
                <Avatar name={user.name} color={user.color} size="sm" />
                <span className="hidden text-sm font-medium text-[var(--color-ink)] sm:inline">{user.name}</span>
                <button onClick={logout} className="btn-ghost" aria-label="Sign out">
                  <LogOut size={14} strokeWidth={2.25} />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
