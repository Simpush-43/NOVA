import type { TaskPriority, TaskStatus } from '../types';
import { PRIORITY_LABELS, STATUS_LABELS } from '../types';

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low: 'bg-[var(--color-slate-soft)] text-[var(--color-slate)]',
  medium: 'bg-[var(--color-indigo-soft)] text-[var(--color-indigo)]',
  high: 'bg-[var(--color-gold-soft)] text-[var(--color-gold-ink)]',
  urgent: 'bg-[var(--color-rust-soft)] text-[var(--color-rust)]',
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[priority]}`}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

const STATUS_DOT: Record<TaskStatus, string> = {
  todo: 'bg-[var(--color-muted-soft)]',
  in_progress: 'bg-[var(--color-indigo)]',
  in_review: 'bg-[var(--color-gold)]',
  done: 'bg-[var(--color-teal)]',
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-muted)]">
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}
