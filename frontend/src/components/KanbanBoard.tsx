import { Plus } from 'lucide-react';
import { useState } from 'react';
import type { Task, TaskStatus } from '../types';
import { STATUS_LABELS, STATUS_ORDER } from '../types';
import { TaskCard } from './TaskCard';

const COLUMN_ACCENT: Record<TaskStatus, string> = {
  todo: 'var(--color-muted-soft)',
  in_progress: 'var(--color-indigo)',
  in_review: 'var(--color-gold)',
  done: 'var(--color-teal)',
};

export function KanbanBoard({
  tasks,
  onOpenTask,
  onMoveTask,
  onQuickAdd,
}: {
  tasks: Task[];
  onOpenTask: (task: Task) => void;
  onMoveTask: (taskId: string, status: TaskStatus) => void;
  onQuickAdd: (status: TaskStatus, title: string) => Promise<void>;
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);

  const grouped: Record<TaskStatus, Task[]> = {
    todo: [],
    in_progress: [],
    in_review: [],
    done: [],
  };
  for (const t of tasks) grouped[t.status].push(t);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {STATUS_ORDER.map((status) => (
        <div
          key={status}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverStatus(status);
          }}
          onDragLeave={() => setDragOverStatus((prev) => (prev === status ? null : prev))}
          onDrop={(e) => {
            e.preventDefault();
            const taskId = e.dataTransfer.getData('text/plain');
            if (taskId) onMoveTask(taskId, status);
            setDraggingId(null);
            setDragOverStatus(null);
          }}
          className={`flex flex-col gap-3 rounded-xl p-2 transition ${
            dragOverStatus === status ? 'bg-[var(--color-slate-soft)]' : ''
          }`}
        >
          <div className="flex items-center gap-2 px-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLUMN_ACCENT[status] }} />
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">{STATUS_LABELS[status]}</h3>
            <span className="text-xs font-medium text-[var(--color-muted-soft)]">{grouped[status].length}</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {grouped[status].map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isDragging={draggingId === task.id}
                onOpen={() => onOpenTask(task)}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', task.id);
                  e.dataTransfer.effectAllowed = 'move';
                  setDraggingId(task.id);
                }}
              />
            ))}
          </div>

          <QuickAdd status={status} onAdd={onQuickAdd} />
        </div>
      ))}
    </div>
  );
}

function QuickAdd({ status, onAdd }: { status: TaskStatus; onAdd: (status: TaskStatus, title: string) => Promise<void> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    const trimmed = title.trim();
    if (!trimmed) {
      setIsOpen(false);
      return;
    }
    setIsSubmitting(true);
    try {
      await onAdd(status, trimmed);
      setTitle('');
      setIsOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="btn-ghost justify-start gap-1.5 px-1.5 text-left text-[var(--color-muted)]"
      >
        <Plus size={14} strokeWidth={2.25} />
        Add task
      </button>
    );
  }

  return (
    <div className="panel p-2.5">
      <textarea
        autoFocus
        rows={2}
        value={title}
        maxLength={200}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
          if (e.key === 'Escape') {
            setIsOpen(false);
            setTitle('');
          }
        }}
        placeholder="Task title…"
        className="w-full resize-none border-none p-0 text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted-soft)]"
      />
      <div className="mt-2 flex justify-end gap-2">
        <button
          onClick={() => {
            setIsOpen(false);
            setTitle('');
          }}
          className="btn-ghost"
        >
          Cancel
        </button>
        <button onClick={submit} disabled={isSubmitting} className="btn-primary px-3 py-1.5 text-xs">
          Add
        </button>
      </div>
    </div>
  );
}
