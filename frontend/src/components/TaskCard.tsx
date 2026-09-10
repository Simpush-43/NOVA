import type { Task } from '../types';
import { PriorityBadge } from './Badges';
import { Avatar } from './Avatar';
import { formatDueDate, isOverdue } from '../utils';

export function TaskCard({
  task,
  onOpen,
  onDragStart,
  isDragging,
}: {
  task: Task;
  onOpen: () => void;
  onDragStart: (e: React.DragEvent) => void;
  isDragging: boolean;
}) {
  const overdue = isOverdue(task.due_date, task.status);

  return (
    <button
      draggable
      onDragStart={onDragStart}
      onClick={onOpen}
      className={`panel flex w-full flex-col gap-2.5 p-3.5 text-left transition ${
        isDragging ? 'opacity-40' : 'hover:border-[var(--color-line-strong)]'
      }`}
    >
      <p className="text-sm font-medium leading-snug text-[var(--color-ink)]">{task.title}</p>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <PriorityBadge priority={task.priority} />
          {task.due_date && (
            <span className={`text-xs font-medium ${overdue ? 'text-[var(--color-rust)]' : 'text-[var(--color-muted)]'}`}>
              {overdue ? 'Overdue ' : ''}
              {formatDueDate(task.due_date)}
            </span>
          )}
        </div>
        {task.assignee_name && task.assignee_color && (
          <Avatar name={task.assignee_name} color={task.assignee_color} size="sm" />
        )}
      </div>
    </button>
  );
}
