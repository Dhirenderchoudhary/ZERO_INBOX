'use client';
import { useState } from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { api } from '@/trpc/react';
import { CreateEventModal } from './create-event-modal';

export function WeekView() {
  const [currentWeek, setCurrentWeek] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [showModal, setShowModal] = useState(false);

  const { data: events = [] } = api.calendar.getWeekEvents.useQuery({
    weekStart: currentWeek.toISOString()
  });

  const days = Array.from({ length: 7 }).map((_, i) => addDays(currentWeek, i));

  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--color-bg-0)' }}>
      <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: 'var(--color-border-0)', background: 'var(--color-bg-1)' }}>
        <h1 className="text-title" style={{ color: 'var(--color-text-0)' }}>Calendar</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="px-3 py-1.5 rounded text-small font-medium transition-colors hover:opacity-90"
          style={{ background: 'var(--color-accent)', color: '#000' }}
        >
          New Event
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {days.map(day => {
          const dayEvents = (events as any[]).filter(e => isSameDay(new Date(e.data?.start?.dateTime || e.start?.dateTime || e.updated_at || e.updated || new Date()), day));
          return (
            <div key={day.toISOString()} className="flex-1 flex flex-col border-r" style={{ borderColor: 'var(--color-border-0)' }}>
              <div className="p-3 border-b text-center flex flex-col items-center" style={{ borderColor: 'var(--color-border-0)', background: 'var(--color-bg-2)' }}>
                <p className="text-micro mb-0.5" style={{ color: 'var(--color-text-2)' }}>{format(day, 'EEE').toUpperCase()}</p>
                <p className="text-title w-7 h-7 flex items-center justify-center rounded-full" 
                   style={{ 
                     color: isSameDay(day, new Date()) ? '#000' : 'var(--color-text-0)',
                     background: isSameDay(day, new Date()) ? 'var(--color-accent)' : 'transparent'
                   }}>
                  {format(day, 'd')}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-2 gap-2 flex flex-col">
                {dayEvents.map((event: any) => (
                  <div key={event.id || event.entity_id} className="p-2 rounded cursor-pointer transition-colors hover:opacity-80" style={{ background: 'var(--color-bg-3)', border: '1px solid var(--color-border-1)', borderLeft: '2px solid var(--color-accent)' }}>
                    <p className="text-small font-medium truncate mb-1" style={{ color: 'var(--color-text-0)' }}>{event.data?.summary || event.summary || '(No title)'}</p>
                    <p className="text-micro" style={{ color: 'var(--color-text-2)' }}>
                      {(event.data?.start?.dateTime || event.start?.dateTime) ? format(new Date(event.data?.start?.dateTime || event.start?.dateTime), 'h:mm a') : 'All day'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && <CreateEventModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
