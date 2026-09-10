import { useState, type FormEvent } from 'react';
import { Modal } from './Modal';
import { inviteMember } from '../api/projects';
import type { Member } from '../types';
import { errorMessage } from '../utils';

export function InviteMemberModal({
  projectId,
  onClose,
  onInvited,
}: {
  projectId: string;
  onClose: () => void;
  onInvited: (member: Member) => void;
}) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const member = await inviteMember(projectId, email.trim());
      onInvited(member);
      onClose();
    } catch (err) {
      setError(errorMessage(err, 'Could not add this person.'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-6">
        <h2 className="font-display text-lg font-medium text-[var(--color-ink)]">Add a teammate</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          They'll need a NOVA account already — invite them to sign up first if they're new.
        </p>

        <label className="mt-5 flex flex-col gap-1.5 text-sm font-medium text-[var(--color-ink)]">
          Email address
          <input
            autoFocus
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="teammate@company.com"
            className="input"
          />
        </label>

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
            {isSubmitting ? 'Adding…' : 'Add to project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
