import { useState } from 'react';
import type { Member } from '../types';
import { Avatar } from './Avatar';
import { useAuth } from '../context/AuthContext';

export function MembersBar({
  members,
  ownerId,
  currentRole,
  onInviteClick,
  onRemove,
}: {
  members: Member[];
  ownerId: string;
  currentRole: 'owner' | 'admin' | 'member';
  onInviteClick: () => void;
  onRemove: (userId: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const canManage = currentRole === 'owner' || currentRole === 'admin';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center -space-x-2 rounded-full transition hover:opacity-90"
        aria-label="View project members"
      >
        {members.slice(0, 5).map((m) => (
          <span key={m.id} className="ring-2 ring-[var(--color-paper)] rounded-full">
            <Avatar name={m.name} color={m.color} size="sm" />
          </span>
        ))}
        {members.length > 5 && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-slate-soft)] text-[10px] font-semibold text-[var(--color-muted)] ring-2 ring-[var(--color-paper)]">
            +{members.length - 5}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} aria-hidden="true" />
          <div className="panel absolute right-0 top-9 z-40 w-72 p-3">
            <div className="flex items-center justify-between px-1 pb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-soft)]">
                Members
              </h4>
              {canManage && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onInviteClick();
                  }}
                  className="text-xs font-semibold text-[var(--color-ink)] underline decoration-[var(--color-gold)] decoration-2 underline-offset-2"
                >
                  Add
                </button>
              )}
            </div>
            <div className="flex max-h-64 flex-col gap-1 overflow-y-auto scrollbar-thin">
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-2 rounded-lg px-1 py-1.5">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={m.name} color={m.color} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-[var(--color-ink)]">
                        {m.name} {m.id === user?.id && <span className="text-[var(--color-muted-soft)]">(you)</span>}
                      </p>
                      <p className="text-xs capitalize text-[var(--color-muted-soft)]">{m.role}</p>
                    </div>
                  </div>
                  {(canManage || m.id === user?.id) && m.id !== ownerId && (
                    <button
                      onClick={() => onRemove(m.id)}
                      className="btn-ghost px-2 py-1 text-xs text-[var(--color-rust)]"
                    >
                      {m.id === user?.id ? 'Leave' : 'Remove'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
