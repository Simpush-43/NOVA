import { useState, type FormEvent } from 'react';
import { Modal } from './Modal';
import { errorMessage } from '../utils';

export function NewProjectModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, description: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onCreate(name.trim(), description.trim());
      onClose();
    } catch (err) {
      setError(errorMessage(err, 'Could not create the project.'));
      setIsSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6">
        <h2 className="font-display text-lg font-medium text-[var(--color-ink)]">New project</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">Give your team something to rally around.</p>

        <div className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--color-ink)]">
            Project name
            <input
              autoFocus
              required
              minLength={2}
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Website redesign"
              className="input"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--color-ink)]">
            Description <span className="font-normal text-[var(--color-muted)]">(optional)</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this project about?"
              rows={3}
              maxLength={2000}
              className="input resize-none"
            />
          </label>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-[var(--color-rust-soft)] px-3 py-2 text-sm text-[var(--color-rust)]">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2.5">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? 'Creating…' : 'Create project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
