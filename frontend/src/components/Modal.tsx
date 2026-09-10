import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

export function Modal({
  onClose,
  children,
  maxWidth = 'max-w-md',
}: {
  onClose: () => void;
  children: ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[var(--color-ink)]/45 px-4 py-10 backdrop-blur-[2px]">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className={`relative w-full ${maxWidth} rounded-xl bg-[var(--color-surface)] shadow-[var(--shadow-float)]`}>
        {children}
      </div>
    </div>,
    document.body
  );
}
