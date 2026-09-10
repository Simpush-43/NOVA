import type { ReactNode } from 'react';

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="panel flex flex-col items-center gap-3 px-6 py-16 text-center">
      {icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-gold-soft)]">
          {icon}
        </span>
      )}
      <h3 className="font-display text-lg font-medium text-[var(--color-ink)]">{title}</h3>
      <p className="max-w-sm text-sm leading-relaxed text-[var(--color-muted)]">{description}</p>
      {action}
    </div>
  );
}
