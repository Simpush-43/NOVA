import { useEffect, useState, type FormEvent } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Modal } from './Modal';
import { Avatar } from './Avatar';
import type { Comment, Member, Task, TaskPriority, TaskStatus } from '../types';
import { PRIORITY_LABELS, STATUS_LABELS, STATUS_ORDER } from '../types';
import { addComment, deleteTask, listComments, updateTask } from '../api/tasks';
import { errorMessage, relativeTime } from '../utils';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

export function TaskModal({
  task,
  members,
  onClose,
  onUpdated,
  onDeleted,
}: {
  task: Task;
  members: Member[];
  onClose: () => void;
  onUpdated: (task: Task) => void;
  onDeleted: (taskId: string) => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [assigneeId, setAssigneeId] = useState<string>(task.assignee_id ?? '');
  const [dueDate, setDueDate] = useState(task.due_date ?? '');

  const [comments, setComments] = useState<Comment[] | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { notify } = useToast();

  useEffect(() => {
    let cancelled = false;
    listComments(task.id)
      .then((c) => {
        if (!cancelled) setComments(c);
      })
      .catch(() => {
        if (!cancelled) setComments([]);
      });
    return () => {
      cancelled = true;
    };
  }, [task.id]);

  const isDirty =
    title.trim() !== task.title ||
    description !== task.description ||
    status !== task.status ||
    priority !== task.priority ||
    (assigneeId || null) !== task.assignee_id ||
    (dueDate || null) !== task.due_date;

  async function handleSave() {
    if (!title.trim()) {
      setError('Task title cannot be empty.');
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      const updated = await updateTask(task.id, {
        title: title.trim(),
        description,
        status,
        priority,
        assigneeId: assigneeId || null,
        dueDate: dueDate || null,
      });
      onUpdated(updated);
      notify('Task updated.', 'success');
      onClose();
    } catch (err) {
      setError(errorMessage(err, 'Could not save your changes.'));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      await deleteTask(task.id);
      onDeleted(task.id);
      notify('Task deleted.', 'info');
    } catch (err) {
      setError(errorMessage(err, 'Could not delete this task.'));
      setIsDeleting(false);
    }
  }

  async function handleAddComment(e: FormEvent) {
    e.preventDefault();
    const body = newComment.trim();
    if (!body) return;
    try {
      const comment = await addComment(task.id, body);
      setComments((prev) => [...(prev ?? []), comment]);
      setNewComment('');
    } catch (err) {
      notify(errorMessage(err, 'Could not post your comment.'), 'error');
    }
  }

  return (
    <Modal onClose={onClose} maxWidth="max-w-2xl">
      <div className="flex max-h-[85vh] flex-col">
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-line)] px-6 py-4">
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            rows={1}
            maxLength={200}
            className="w-full resize-none border-none bg-transparent font-display text-lg font-medium text-[var(--color-ink)] outline-none"
          />
          <button onClick={onClose} className="btn-ghost shrink-0" aria-label="Close">
            <X size={18} strokeWidth={2.25} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <FieldSelect label="Status" value={status} onChange={(v) => setStatus(v as TaskStatus)}>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </FieldSelect>
            <FieldSelect label="Priority" value={priority} onChange={(v) => setPriority(v as TaskPriority)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABELS[p]}
                </option>
              ))}
            </FieldSelect>
            <FieldSelect label="Assignee" value={assigneeId} onChange={setAssigneeId}>
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </FieldSelect>
            <label className="flex flex-col gap-1.5 text-xs font-medium text-[var(--color-muted)]">
              Due date
              <input
                type="date"
                value={dueDate ? dueDate.slice(0, 10) : ''}
                onChange={(e) => setDueDate(e.target.value)}
                className="input text-sm"
              />
            </label>
          </div>

          <label className="mt-5 flex flex-col gap-1.5 text-xs font-medium text-[var(--color-muted)]">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={4000}
              placeholder="Add more detail…"
              className="input resize-none text-sm text-[var(--color-ink)]"
            />
          </label>

          {error && (
            <p role="alert" className="mt-4 rounded-lg bg-[var(--color-rust-soft)] px-3 py-2 text-sm text-[var(--color-rust)]">
              {error}
            </p>
          )}

          <div className="mt-7 border-t border-[var(--color-line)] pt-5">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-soft)]">
              Comments
            </h4>

            <div className="mt-3 flex flex-col gap-3">
              {comments === null && <p className="text-sm text-[var(--color-muted)]">Loading comments…</p>}
              {comments && comments.length === 0 && (
                <p className="text-sm text-[var(--color-muted)]">No comments yet — add the first update.</p>
              )}
              {comments?.map((c) => (
                <div key={c.id} className="flex gap-2.5">
                  <Avatar name={c.user_name} color={c.user_color} size="sm" />
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-[var(--color-ink)]">{c.user_name}</span>
                      <span className="text-xs text-[var(--color-muted-soft)]">{relativeTime(c.created_at)}</span>
                    </div>
                    <p className="text-sm leading-relaxed text-[var(--color-ink)]/85">{c.body}</p>
                  </div>
                </div>
              ))}
            </div>

            {user && (
              <form onSubmit={handleAddComment} className="mt-4 flex gap-2.5">
                <Avatar name={user.name} color={user.color} size="sm" />
                <div className="flex flex-1 gap-2">
                  <input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment…"
                    maxLength={2000}
                    className="input flex-1"
                  />
                  <button type="submit" className="btn-secondary shrink-0">
                    Post
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--color-line)] px-6 py-4">
          {confirmingDelete ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[var(--color-muted)]">Delete this task?</span>
              <button onClick={handleDelete} disabled={isDeleting} className="font-semibold text-[var(--color-rust)]">
                {isDeleting ? 'Deleting…' : 'Confirm'}
              </button>
              <button onClick={() => setConfirmingDelete(false)} className="text-[var(--color-muted)]">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmingDelete(true)} className="btn-ghost text-[var(--color-rust)]">
              <Trash2 size={14} strokeWidth={2.25} />
              Delete task
            </button>
          )}

          <button onClick={handleSave} disabled={!isDirty || isSaving} className="btn-primary">
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-xs font-medium text-[var(--color-muted)]">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input text-sm">
        {children}
      </select>
    </label>
  );
}
