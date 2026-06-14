import { type LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 px-8 text-center anim-fade-in">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: 'var(--bg-3)', border: '1px solid var(--border-1)' }}
      >
        <Icon size={18} style={{ color: 'var(--text-3)' }} />
      </div>
      <div>
        <p className="t-body font-medium mb-0.5" style={{ color: 'var(--text-1)' }}>{title}</p>
        <p className="t-small" style={{ color: 'var(--text-3)' }}>{description}</p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="t-small px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80 mt-1"
          style={{ background: 'var(--bg-4)', color: 'var(--text-1)', border: '1px solid var(--border-2)' }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
