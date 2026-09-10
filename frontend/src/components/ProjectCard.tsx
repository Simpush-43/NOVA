import { Link } from 'react-router-dom';
import { CheckCircle2, Users } from 'lucide-react';
import type { Project } from '../types';
import { Avatar } from './Avatar';

export function ProjectCard({ project }: { project: Project }) {
  const { stats } = project;
  const preview = project.member_preview ?? [];
  const extraMembers = (project.member_count ?? preview.length) - preview.length;

  return (
    <Link
      to={`/projects/${project.id}`}
      className="panel group flex flex-col gap-4 p-5 transition hover:border-[var(--color-line-strong)] hover:shadow-[var(--shadow-float)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
            style={{ backgroundColor: project.color }}
          >
            {project.key}
          </span>
          <div>
            <h3 className="font-display text-base font-medium text-[var(--color-ink)] decoration-[var(--color-gold)] decoration-2 underline-offset-2 group-hover:underline">
              {project.name}
            </h3>
            <p className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
              <Users size={12} strokeWidth={2.25} />
              {project.member_count ?? 1} member{(project.member_count ?? 1) === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {preview.length > 0 && (
          <div className="flex -space-x-2">
            {preview.map((m) => (
              <span key={m.id} className="rounded-full ring-2 ring-[var(--color-surface)]">
                <Avatar name={m.name} color={m.color} size="sm" />
              </span>
            ))}
            {extraMembers > 0 && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-slate-soft)] text-[10px] font-semibold text-[var(--color-muted)] ring-2 ring-[var(--color-surface)]">
                +{extraMembers}
              </span>
            )}
          </div>
        )}
      </div>

      {project.description && (
        <p className="line-clamp-2 text-sm leading-relaxed text-[var(--color-muted)]">{project.description}</p>
      )}

      <div className="mt-auto">
        <div className="flex items-center justify-between text-xs font-medium text-[var(--color-muted)]">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={13} strokeWidth={2.25} className="text-[var(--color-teal)]" />
            {stats.done} of {stats.total || 0} tasks done
          </span>
          <span>{stats.percentComplete}%</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-slate-soft)]">
          <div
            className="h-full rounded-full bg-[var(--color-teal)] transition-all"
            style={{ width: `${stats.percentComplete}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
