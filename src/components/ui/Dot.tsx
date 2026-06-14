interface DotProps {
  color?: string;
  pulse?: boolean;
  size?: number;
}
export function Dot({ color = 'var(--accent)', pulse = false, size = 6 }: DotProps) {
  return (
    <span
      className="inline-block rounded-full flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: color,
        animation: pulse ? 'pulse-dot 2s ease-in-out infinite' : 'none',
      }}
    />
  );
}
