import { useEffect, useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { Layout } from '../components/Layout';
import { ProjectCard } from '../components/ProjectCard';
import { EmptyState } from '../components/EmptyState';
import { NewProjectModal } from '../components/NewProjectModal';
import { StatsStrip } from '../components/StatsStrip';
import { createProject, listProjects } from '../api/projects';
import type { Project } from '../types';
import { errorMessage } from '../utils';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const { notify } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;
    listProjects()
      .then((data) => {
        if (!cancelled) setProjects(data);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, 'Could not load your projects.'));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreate(name: string, description: string) {
    const project = await createProject(name, description);
    setProjects((prev) => [project, ...(prev ?? [])]);
    notify(`${project.name} is ready to go.`, 'success');
  }

  const firstName = user?.name.split(' ')[0];

  return (
    <Layout>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium text-[var(--color-ink)]">
            {firstName ? `${firstName}'s projects` : 'Projects'}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">Everything you're working on, in one place.</p>
        </div>
        <button onClick={() => setShowNewProject(true)} className="btn-primary">
          <Plus size={16} strokeWidth={2.5} />
          New project
        </button>
      </div>

      <div className="mt-6">
        {error && (
          <p role="alert" className="rounded-lg bg-[var(--color-rust-soft)] px-3 py-2 text-sm text-[var(--color-rust)]">
            {error}
          </p>
        )}

        {!error && projects === null && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="panel h-[70px] animate-pulse" />
              ))}
            </div>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="panel h-40 animate-pulse" />
              ))}
            </div>
          </>
        )}

        {projects && projects.length === 0 && (
          <EmptyState
            icon={<Sparkles size={22} strokeWidth={2} className="text-[var(--color-gold)]" />}
            title="No projects yet"
            description="Create your first project to start planning tasks and bringing your team together."
            action={
              <button onClick={() => setShowNewProject(true)} className="btn-primary mt-2">
                <Plus size={16} strokeWidth={2.5} />
                New project
              </button>
            }
          />
        )}

        {projects && projects.length > 0 && (
          <>
            <StatsStrip projects={projects} />
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </>
        )}
      </div>

      {showNewProject && <NewProjectModal onClose={() => setShowNewProject(false)} onCreate={handleCreate} />}
    </Layout>
  );
}
