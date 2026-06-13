'use client';
import { Sidebar } from './sidebar';
import { CommandPalette } from './command-palette';
import { useKeyboard } from '@/hooks/useKeyboard';

export function AppShell({ children }: { children: React.ReactNode }) {
  useKeyboard(); // register global keyboard shortcuts

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-bg-0)' }}>
      <Sidebar />
      <main className="flex-1 flex overflow-hidden min-w-0">
        {children}
      </main>
      <CommandPalette />
    </div>
  );
}
