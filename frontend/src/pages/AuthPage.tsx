import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errorMessage } from '../utils';

const VALUE_PROPS = [
  { stat: '4', label: 'stages from idea to shipped — todo, in progress, review, done' },
  { stat: '1', label: 'board every teammate sees the same way, in real time' },
];

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      navigate('/', { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Could not sign you in. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[var(--color-ink)] px-14 py-12 text-white lg:flex">
        <BurstMark />
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <NovaMark size={28} />
            <span className="font-display text-xl font-semibold tracking-tight">NOVA</span>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-[2.75rem] leading-[1.08] font-medium">
            Plan the work.
            <br />
            Watch it move.
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-white/65">
            NOVA gives your team one board for every project — who's doing what, what's stuck, and what
            shipped this week.
          </p>
        </div>

        <div className="relative z-10 flex gap-10">
          {VALUE_PROPS.map((v) => (
            <div key={v.label} className="max-w-[180px]">
              <div className="font-display text-3xl font-medium text-[var(--color-gold)]">{v.stat}</div>
              <div className="mt-1 text-sm leading-snug text-white/55">{v.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-[var(--color-paper)] px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <NovaMark size={26} />
            <span className="font-display text-lg font-semibold">NOVA</span>
          </div>

          <h2 className="font-display text-2xl font-medium text-[var(--color-ink)]">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="mt-1.5 text-sm text-[var(--color-muted)]">
            {mode === 'login' ? 'Sign in to get back to your projects.' : 'Set up NOVA for your team in under a minute.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4" noValidate>
            {mode === 'register' && (
              <Field label="Full name">
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder="Ananya Sharma"
                  className="input"
                />
              </Field>
            )}
            <Field label="Email">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@company.com"
                className="input"
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                required
                minLength={mode === 'register' ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'}
                className="input"
              />
            </Field>

            {error && (
              <p role="alert" className="rounded-lg bg-[var(--color-rust-soft)] px-3 py-2 text-sm text-[var(--color-rust)]">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 inline-flex items-center justify-center rounded-lg bg-[var(--color-ink)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-ink)]/90 disabled:opacity-60"
            >
              {isSubmitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError(null);
              }}
              className="font-semibold text-[var(--color-ink)] underline decoration-[var(--color-gold)] decoration-2 underline-offset-2"
            >
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--color-ink)]">
      {label}
      {children}
    </label>
  );
}

export function NovaMark({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="var(--color-ink)" />
      <path d="M16 6 L19.2 13.4 L27 16 L19.2 18.6 L16 26 L12.8 18.6 L5 16 L12.8 13.4 Z" fill="var(--color-gold)" />
    </svg>
  );
}

function BurstMark() {
  return (
    <svg
      className="pointer-events-none absolute -right-24 -top-24 opacity-[0.18]"
      width="440"
      height="440"
      viewBox="0 0 440 440"
      fill="none"
    >
      <path d="M220 40 L246 195 L400 220 L246 245 L220 400 L194 245 L40 220 L194 195 Z" fill="var(--color-gold)" />
    </svg>
  );
}
