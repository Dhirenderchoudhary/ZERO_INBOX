"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";

export function ThemeToggle() {
  const { setTheme, theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && (theme === "dark" || resolvedTheme === "dark");

  const toggleTheme = (event: React.MouseEvent) => {
    const newTheme = isDark ? "light" : "dark";
    if (!document.startViewTransition) {
      setTheme(newTheme);
      return;
    }

    const x = event.clientX;
    const y = event.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = document.startViewTransition(() => {
      setTheme(newTheme);
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];
      document.documentElement.animate(
        {
          clipPath: clipPath,
        },
        {
          duration: 500,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    });
  };

  return (
    <button
      onClick={toggleTheme}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--border-2)] bg-[var(--bg-1)] text-[var(--text-1)] transition-colors hover:bg-[var(--bg-2)] hover:text-[var(--text-0)]"
      style={{ perspective: "1000px" }}
      aria-label="Toggle theme"
    >
      <div className="relative flex items-center justify-center">
        <Moon className="h-4 w-4 [transform:rotateY(0deg)] transition-all duration-500 dark:[transform:rotateY(180deg)] dark:opacity-0" />
        <Sun className="absolute h-4 w-4 [transform:rotateY(-180deg)] opacity-0 transition-all duration-500 dark:[transform:rotateY(0deg)] dark:opacity-100" />
      </div>
    </button>
  );
}
