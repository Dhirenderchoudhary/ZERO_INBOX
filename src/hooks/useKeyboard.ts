import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export function useKeyboard() {
  const router = useRouter();
  const [sequence, setSequence] = useState('');
  const sequenceTimer = useRef<NodeJS.Timeout>(undefined);
  
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (['INPUT','TEXTAREA'].includes((e.target as Element)?.tagName)) return;
      
      if (e.key === 'g') {
        setSequence('g');
        sequenceTimer.current = setTimeout(() => setSequence(''), 500);
        return;
      }
      
      if (sequence === 'g') {
        clearTimeout(sequenceTimer.current);
        setSequence('');
        if (e.key === 'i') router.push('/inbox');
        if (e.key === 'c') router.push('/calendar');
        if (e.key === 'a') router.push('/agent');
        return;
      }
      
      if (e.key === 'c') window.dispatchEvent(new CustomEvent('compose'));
      if (e.key === '/') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('cmd-k'));
      }
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('cmd-k'));
      }
      if (e.key === 'Escape') {
        window.dispatchEvent(new CustomEvent('close-modals'));
      }
    };
    
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [sequence, router]);
}
