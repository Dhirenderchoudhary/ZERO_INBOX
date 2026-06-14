'use client';
import { useEffect, useState } from 'react';
import { ComposeModal } from '@/components/email/compose-modal';

export function GlobalCompose() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleCompose = () => setOpen(true);
    window.addEventListener('compose', handleCompose);
    return () => window.removeEventListener('compose', handleCompose);
  }, []);

  if (!open) return null;

  return <ComposeModal onClose={() => setOpen(false)} />;
}
