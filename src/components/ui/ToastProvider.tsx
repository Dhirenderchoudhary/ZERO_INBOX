'use client';
import { Toaster } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: 'var(--bg-3)',
          border: '1px solid var(--border-2)',
          color: 'var(--text-0)',
          fontFamily: 'var(--font-sans)',
          fontSize: '13px',
          borderRadius: '10px',
        },
      }}
    />
  );
}
