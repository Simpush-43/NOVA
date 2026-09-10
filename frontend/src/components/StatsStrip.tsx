import { CheckCircle2, Clock, FolderKanban, ListTodo } from 'lucide-react';
import type { Project } from '../types';

export function StatsStrip({ projects }: { projects: Project[] }) {
  const totals = projects.reduce(
    (acc, p) => {
      acc.tasks += p.stats.total;
      acc.inProgress += p.stats.in_progress + p.stats.in_review;
      acc.done += p.stats.done;
      return acc;
    },
    { tasks: 0, inProgress: 0, done: 0 }
  );

  const items = [
    { label: 'Active projects', value: projects.length, icon: FolderKanban, tint: 'var(--color-gold)' },
    { label: 'Total tasks', value: totals.tasks, icon: ListTodo, tint: 'var(--color-indigo)' },
    { label: 'In progress', value: totals.inProgress, icon: Clock, tint: 'var(--color-muted)' },
    { label: 'Completed', value: totals.done, icon: CheckCircle2, tint: 'var(--color-teal)' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(({ label, value, icon: Icon, tint }) => (
        <div key={label} className="panel flex items-center gap-3.5 px-4 py-3.5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ backgroundColor: `color-mix(in srgb, ${tint} 14%, white)` }}
          >
            <Icon size={17} strokeWidth={2.25} style={{ color: tint }} />
          </span>
          <div>
            <p className="font-display text-xl font-medium leading-none text-[var(--color-ink)]">{value}</p>
            <p className="mt-1 text-xs font-medium text-[var(--color-muted)]">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
