'use client';
import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { Inbox, Calendar, Bot, Send, Star, PenSquare } from 'lucide-react';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onClose = () => setOpen(false);
    
    window.addEventListener('cmd-k', onOpen);
    window.addEventListener('close-modals', onClose);
    
    return () => {
      window.removeEventListener('cmd-k', onOpen);
      window.removeEventListener('close-modals', onClose);
    };
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={() => setOpen(false)} 
      />
      
      <Command 
        className="relative w-full max-w-lg rounded-xl shadow-2xl overflow-hidden"
        style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border-1)' }}
        label="Global Command Menu"
      >
        <Command.Input 
          autoFocus 
          placeholder="Type a command or search..." 
          className="w-full px-4 py-4 outline-none text-base bg-transparent border-b"
          style={{ borderColor: 'var(--color-border-0)', color: 'var(--color-text-0)' }}
        />
        
        <Command.List className="max-h-[300px] overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm" style={{ color: 'var(--color-text-2)' }}>
            No results found.
          </Command.Empty>
          
          <Command.Group heading="Navigation" className="px-2 py-1 text-xs font-semibold" style={{ color: 'var(--color-text-2)' }}>
            <Command.Item 
              onSelect={() => { router.push('/inbox'); setOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 mt-1 rounded-md cursor-pointer data-[selected=true]:bg-[var(--color-bg-3)] data-[selected=true]:text-[var(--color-text-0)]"
              style={{ color: 'var(--color-text-1)' }}
            >
              <Inbox size={14} /> Go to Inbox
            </Command.Item>
            <Command.Item 
              onSelect={() => { router.push('/calendar'); setOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 mt-1 rounded-md cursor-pointer data-[selected=true]:bg-[var(--color-bg-3)] data-[selected=true]:text-[var(--color-text-0)]"
              style={{ color: 'var(--color-text-1)' }}
            >
              <Calendar size={14} /> Go to Calendar
            </Command.Item>
            <Command.Item 
              onSelect={() => { router.push('/agent'); setOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 mt-1 rounded-md cursor-pointer data-[selected=true]:bg-[var(--color-bg-3)] data-[selected=true]:text-[var(--color-text-0)]"
              style={{ color: 'var(--color-text-1)' }}
            >
              <Bot size={14} /> Chat with Agent
            </Command.Item>
          </Command.Group>

          <Command.Group heading="Actions" className="px-2 py-1 mt-2 text-xs font-semibold" style={{ color: 'var(--color-text-2)' }}>
            <Command.Item 
              onSelect={() => { window.dispatchEvent(new CustomEvent('compose')); setOpen(false); }}
              className="flex items-center gap-2 px-3 py-2 mt-1 rounded-md cursor-pointer data-[selected=true]:bg-[var(--color-accent-glow)] data-[selected=true]:text-[var(--color-accent)]"
              style={{ color: 'var(--color-text-1)' }}
            >
              <PenSquare size={14} /> Compose Email
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}
