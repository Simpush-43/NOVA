import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ActivityItem } from '../types';
import { Avatar } from './Avatar';
import { getActivity } from '../api/projects';
import { relativeTime } from '../utils';

export function ActivityPanel({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const [items, setItems] = useState<ActivityItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getActivity(projectId)
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-[var(--color-ink)]/30" onClick={onClose} aria-hidden="true" />
      <div className="relative flex h-full w-full max-w-sm flex-col bg-[var(--color-surface)] shadow-[var(--shadow-float)]">
        <div className="flex items-center justify-between border-b border-[var(--color-line)] px-5 py-4">
          <h3 className="font-display text-base font-medium text-[var(--color-ink)]">Activity</h3>
          <button onClick={onClose} className="btn-ghost" aria-label="Close activity panel">
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-4">
          {items === null && <p className="text-sm text-[var(--color-muted)]">Loading…</p>}
          {items && items.length === 0 && (
            <p className="text-sm text-[var(--color-muted)]">Nothing has happened here yet.</p>
          )}
          <div className="flex flex-col gap-4">
            {items?.map((item) => (
              <div key={item.id} className="flex gap-3">
                <Avatar name={item.user_name} color={item.user_color} size="sm" />
                <div className="flex-1">
                  <p className="text-sm leading-snug text-[var(--color-ink)]">
                    <span className="font-semibold">{item.user_name}</span> {item.action}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-muted-soft)]">{relativeTime(item.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
