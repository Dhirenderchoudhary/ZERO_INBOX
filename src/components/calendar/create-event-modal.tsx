'use client';
import { useState } from 'react';
import { X, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { api } from '@/trpc/react';
import { format, addHours } from 'date-fns';

export function CreateEventModal({ onClose }: { onClose: () => void }) {
  const [summary, setSummary] = useState('');
  const [startTime, setStartTime] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [endTime, setEndTime] = useState(format(addHours(new Date(), 1), "yyyy-MM-dd'T'HH:mm"));
  const [attendees, setAttendees] = useState('');

  const create = api.calendar.createEvent.useMutation({
    onSuccess: () => onClose()
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[400px] rounded-xl shadow-2xl overflow-hidden" style={{ background: 'var(--color-bg-2)', border: '1px solid var(--color-border-1)' }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--color-border-0)' }}>
          <span className="text-small font-semibold" style={{ color: 'var(--color-text-0)' }}>New Event</span>
          <button onClick={onClose} className="p-1 rounded hover:opacity-80" style={{ color: 'var(--color-text-2)' }}>
            <X size={14} />
          </button>
        </div>
        
        <div className="p-4 flex flex-col gap-3">
          <div>
            <label className="text-micro mb-1 block" style={{ color: 'var(--color-text-2)' }}>Event Title</label>
            <input value={summary} onChange={e => setSummary(e.target.value)} autoFocus className="w-full px-3 py-1.5 rounded text-small outline-none" style={{ background: 'var(--color-bg-3)', color: 'var(--color-text-0)', border: '1px solid var(--color-border-1)' }} />
          </div>
          
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-micro mb-1 block" style={{ color: 'var(--color-text-2)' }}>Start Time</label>
              <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full px-3 py-1.5 rounded text-small outline-none" style={{ background: 'var(--color-bg-3)', color: 'var(--color-text-0)', border: '1px solid var(--color-border-1)' }} />
            </div>
            <div className="flex-1">
              <label className="text-micro mb-1 block" style={{ color: 'var(--color-text-2)' }}>End Time</label>
              <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full px-3 py-1.5 rounded text-small outline-none" style={{ background: 'var(--color-bg-3)', color: 'var(--color-text-0)', border: '1px solid var(--color-border-1)' }} />
            </div>
          </div>

          <div>
            <label className="text-micro mb-1 block" style={{ color: 'var(--color-text-2)' }}>Attendees (comma separated)</label>
            <input value={attendees} onChange={e => setAttendees(e.target.value)} className="w-full px-3 py-1.5 rounded text-small outline-none" style={{ background: 'var(--color-bg-3)', color: 'var(--color-text-0)', border: '1px solid var(--color-border-1)' }} />
          </div>
        </div>
        
        <div className="px-4 py-3 flex justify-end border-t" style={{ borderColor: 'var(--color-border-0)', background: 'var(--color-bg-1)' }}>
          <button 
            onClick={() => create.mutate({
              summary,
              startTime: new Date(startTime).toISOString(),
              endTime: new Date(endTime).toISOString(),
              attendees: attendees.split(',').map(a => a.trim()).filter(Boolean)
            })}
            disabled={!summary || create.isPending}
            className="flex items-center gap-2 px-4 py-1.5 rounded text-small font-medium transition-colors hover:opacity-90 disabled:opacity-50"
            style={{ background: 'var(--color-accent)', color: '#000' }}
          >
            {create.isPending ? <Loader2 size={14} className="animate-spin" /> : <CalendarIcon size={14} />}
            Create Event
          </button>
        </div>
      </div>
    </div>
  );
}
