export function LoadingDots({ color = "var(--accent)" }: { color?: string }) {
  return (
    <span className="inline-flex items-center gap-[3px]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="dot-bounce inline-block h-[5px] w-[5px] rounded-full"
          style={{ background: color, animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </span>
  );
}
