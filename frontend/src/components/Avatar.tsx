interface AvatarProps {
  name: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return (parts[0] ?? '').slice(0, 2).toUpperCase() || '?';
  const first = parts[0]?.[0] ?? '';
  const last = parts[parts.length - 1]?.[0] ?? '';
  return (first + last).toUpperCase() || '?';
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-11 h-11 text-sm',
};

export function Avatar({ name, color, size = 'md' }: AvatarProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${SIZE_CLASSES[size]}`}
      style={{ backgroundColor: color }}
      title={name}
    >
      {initials(name)}
    </span>
  );
}
