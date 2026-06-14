export function LoadingDots({ color = 'var(--accent)' }: { color?: string }) {
  return (
    <span className="inline-flex items-center gap-[3px]">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="inline-block w-[5px] h-[5px] rounded-full dot-bounce"
          style={{ background: color, animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </span>
  );
}
