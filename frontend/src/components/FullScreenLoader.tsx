export function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-paper)]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-line-strong)] border-t-[var(--color-ink)]" />
        <p className="text-sm text-[var(--color-muted)]">Loading NOVA…</p>
      </div>
    </div>
  );
}
