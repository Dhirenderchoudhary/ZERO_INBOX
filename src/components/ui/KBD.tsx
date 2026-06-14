export function KBD({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      className="t-mono inline-flex items-center rounded px-1.5 py-0.5"
      style={{
        background: "var(--bg-4)",
        border: "1px solid var(--border-2)",
        color: "var(--text-3)",
        fontSize: "10px",
        fontFamily: "var(--font-mono)",
        boxShadow: "0 1px 0 var(--border-2)",
      }}
    >
      {children}
    </kbd>
  );
}
