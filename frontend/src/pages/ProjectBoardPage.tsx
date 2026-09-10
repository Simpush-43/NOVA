import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, History } from 'lucide-react';
import { Layout } from '../components/Layout';
import { KanbanBoard } from '../components/KanbanBoard';
import { TaskModal } from '../components/TaskModal';
import { MembersBar } from '../components/MembersBar';
import { InviteMemberModal } from '../components/InviteMemberModal';
import { ActivityPanel } from '../components/ActivityPanel';
import { getProject, removeMember } from '../api/projects';
import { createTask, listTasks, updateTask } from '../api/tasks';
import type { Project, Task, TaskStatus } from '../types';
import { errorMessage } from '../utils';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';

export default function ProjectBoardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [proj, taskList] = await Promise.all([getProject(id), listTasks(id)]);
      setProject(proj);
      setTasks(taskList);
    } catch (err) {
      setError(errorMessage(err, 'Could not load this project.'));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleMoveTask(taskId: string, status: TaskStatus) {
    const existing = tasks.find((t) => t.id === taskId);
    if (!existing || existing.status === status) return;

    // optimistic update
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    try {
      const updated = await updateTask(taskId, { status });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      refreshStatsSoftly();
    } catch (err) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? existing : t)));
      notify(errorMessage(err, 'Could not move that task.'), 'error');
    }
  }

  async function handleQuickAdd(status: TaskStatus, title: string) {
    if (!id) return;
    try {
      const task = await createTask(id, { title, status });
      setTasks((prev) => [...prev, task]);
      refreshStatsSoftly();
    } catch (err) {
      notify(errorMessage(err, 'Could not create that task.'), 'error');
    }
  }

  function handleTaskUpdated(updated: Task) {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    refreshStatsSoftly();
  }

  function handleTaskDeleted(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setActiveTask(null);
    refreshStatsSoftly();
  }

  // Re-fetch just the project (cheap) to keep the progress bar in sync after task changes
  function refreshStatsSoftly() {
    if (!id) return;
    getProject(id)
      .then((p) => setProject(p))
      .catch(() => {});
  }

  async function handleRemoveMember(userId: string) {
    if (!id || !project) return;
    try {
      await removeMember(id, userId);
      if (userId === user?.id) {
        notify('You left the project.', 'info');
        navigate('/', { replace: true });
        return;
      }
      setProject({ ...project, members: project.members?.filter((m) => m.id !== userId) });
      notify('Member removed.', 'info');
    } catch (err) {
      notify(errorMessage(err, 'Could not remove that member.'), 'error');
    }
  }

  if (error) {
    return (
      <Layout>
        <p role="alert" className="rounded-lg bg-[var(--color-rust-soft)] px-4 py-3 text-sm text-[var(--color-rust)]">
          {error}
        </p>
        <Link to="/" className="btn-secondary mt-4 inline-flex">
          Back to projects
        </Link>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="panel h-24 animate-pulse" />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="panel h-64 animate-pulse" />
          ))}
        </div>
      </Layout>
    );
  }

  const myMembership = project.members?.find((m) => m.id === user?.id);

  return (
    <Layout
      right={
        <button onClick={() => setShowActivity(true)} className="btn-ghost">
          <History size={14} strokeWidth={2.25} />
          Activity
        </button>
      }
    >
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)]">
        <ArrowLeft size={15} strokeWidth={2.25} />
        All projects
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold text-white"
            style={{ backgroundColor: project.color }}
          >
            {project.key}
          </span>
          <div>
            <h1 className="font-display text-2xl font-medium text-[var(--color-ink)]">{project.name}</h1>
            {project.description && (
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-[var(--color-muted)]">{project.description}</p>
            )}
          </div>
        </div>

        {project.members && (
          <MembersBar
            members={project.members}
            ownerId={project.owner_id}
            currentRole={myMembership?.role ?? 'member'}
            onInviteClick={() => setShowInvite(true)}
            onRemove={handleRemoveMember}
          />
        )}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <div className="h-1.5 w-48 overflow-hidden rounded-full bg-[var(--color-slate-soft)]">
          <div
            className="h-full rounded-full bg-[var(--color-teal)] transition-all"
            style={{ width: `${project.stats.percentComplete}%` }}
          />
        </div>
        <span className="text-xs font-medium text-[var(--color-muted)]">
          {project.stats.done} of {project.stats.total} tasks done · {project.stats.percentComplete}%
        </span>
      </div>

      <div className="mt-7">
        <KanbanBoard tasks={tasks} onOpenTask={setActiveTask} onMoveTask={handleMoveTask} onQuickAdd={handleQuickAdd} />
      </div>

      {activeTask && project.members && (
        <TaskModal
          task={activeTask}
          members={project.members}
          onClose={() => setActiveTask(null)}
          onUpdated={handleTaskUpdated}
          onDeleted={handleTaskDeleted}
        />
      )}

      {showInvite && id && (
        <InviteMemberModal
          projectId={id}
          onClose={() => setShowInvite(false)}
          onInvited={(member) => {
            setProject((prev) => (prev ? { ...prev, members: [...(prev.members ?? []), member] } : prev));
            notify(`${member.name} joined the project.`, 'success');
          }}
        />
      )}

      {showActivity && id && <ActivityPanel projectId={id} onClose={() => setShowActivity(false)} />}
    </Layout>
  );
}
