'use client';
import { Clock } from 'lucide-react';

interface SnoozeMenuProps {
  onSnooze: (until: string) => void;
  onClose: () => void;
}

export function SnoozeMenu({ onSnooze, onClose }: SnoozeMenuProps) {
  const options = [
    { label: 'Later Today', get time() { const d = new Date(); d.setHours(d.getHours() + 3); return d.toISOString(); } },
    { label: 'Tomorrow Morning', get time() { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(8, 0, 0, 0); return d.toISOString(); } },
    { label: 'This Weekend', get time() { const d = new Date(); d.setDate(d.getDate() + (6 - d.getDay())); d.setHours(8, 0, 0, 0); return d.toISOString(); } },
    { label: 'Next Week', get time() { const d = new Date(); d.setDate(d.getDate() + (8 - d.getDay())); d.setHours(8, 0, 0, 0); return d.toISOString(); } },
  ];

  return (
    <div className="absolute top-10 right-0 w-48 rounded-md shadow-lg overflow-hidden z-50 border"
         style={{ background: 'var(--bg-1)', borderColor: 'var(--border-1)' }}>
      <div className="px-3 py-2 border-b text-[11px] font-medium" style={{ borderColor: 'var(--border-1)', color: 'var(--text-2)' }}>
        Snooze until...
      </div>
      <div className="py-1">
        {options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => { onSnooze(opt.time); onClose(); }}
            className="w-full text-left px-3 py-2 text-[12px] flex items-center gap-2 hover:bg-[var(--bg-3)] transition-colors"
            style={{ color: 'var(--text-0)' }}
          >
            <Clock size={12} style={{ color: 'var(--text-2)' }} />
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
