import { useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, Calendar } from 'lucide-react';
import type { Reminder } from '@/types';

interface UpcomingRemindersProps {
  reminders: Reminder[];
}

const getReminderTypeStyles = (type: string) => {
  switch (type) {
    case 'Deadline': return 'bg-red-50 text-red-600 border-red-100';
    case 'Interview': return 'bg-blue-50 text-blue-600 border-blue-100';
    default: return 'bg-zinc-50 text-zinc-600 border-zinc-200';
  }
};

export const UpcomingReminders = memo(function UpcomingReminders({ reminders }: UpcomingRemindersProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter out past reminders and sort by closest
  const upcoming = reminders
    .filter(r => new Date(r.reminder_date).getTime() > now.getTime())
    .sort((a, b) => new Date(a.reminder_date).getTime() - new Date(b.reminder_date).getTime());

  const nextEvent = upcoming.length > 0 ? upcoming[0] : null;
  const remainingList = upcoming.slice(1, 4);

  const calculateTimeLeft = (targetDate: Date) => {
    const diffMs = targetDate.getTime() - now.getTime();
    if (diffMs <= 0) return { d: 0, h: 0, m: 0, s: 0 };
    
    return {
      d: Math.floor(diffMs / (1000 * 60 * 60 * 24)),
      h: Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      m: Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)),
      s: Math.floor((diffMs % (1000 * 60)) / 1000)
    };
  };

  const getRelativeTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `${diffDays} days`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <motion.div
      className="mc-stadium-card bg-white p-8 lg:p-10 flex flex-col h-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-[24px] font-medium text-zinc-900 tracking-tight">
          Up Next
        </h3>
        <div className="flex items-center gap-2 text-zinc-400">
          <Calendar size={20} />
          <span className="text-[14px] font-semibold tracking-wider uppercase">Schedule</span>
        </div>
      </div>

      {nextEvent ? (
        <div className="mb-10 p-8 rounded-[24px] bg-zinc-950 text-white relative overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)]">
          {/* Subtle noise/gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/50 to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <span className={`px-3 py-1 rounded-full text-[12px] font-bold uppercase tracking-widest mb-6 ${
              nextEvent.reminder_type === 'Interview' ? 'bg-[#CF4500] text-white' : 'bg-zinc-800 text-zinc-300'
            }`}>
              {nextEvent.reminder_type}
            </span>
            
            <h4 className="text-[32px] md:text-[40px] font-medium tracking-tight leading-tight mb-8">
              {nextEvent.title}
            </h4>

            {/* The Timer */}
            <div className="flex items-center gap-4 md:gap-6 justify-center">
              {Object.entries(calculateTimeLeft(new Date(nextEvent.reminder_date))).map(([unit, value]) => (
                <div key={unit} className="flex flex-col items-center">
                  <div className="w-[64px] h-[64px] md:w-[80px] md:h-[80px] bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center shadow-inner">
                    <span className="text-[32px] md:text-[40px] font-medium font-mono tabular-nums leading-none">
                      {value.toString().padStart(2, '0')}
                    </span>
                  </div>
                  <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest mt-3">
                    {unit === 'd' ? 'Days' : unit === 'h' ? 'Hours' : unit === 'm' ? 'Mins' : 'Secs'}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="mt-8 text-[15px] font-medium text-zinc-400 flex items-center gap-2">
              <Clock size={16} />
              {new Date(nextEvent.reminder_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {new Date(nextEvent.reminder_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-zinc-50 rounded-[24px] border border-zinc-100 mb-8">
          <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4 text-zinc-300 border border-zinc-200">
            <CheckCircle2 size={32} />
          </div>
          <p className="text-[16px] font-medium text-zinc-500 tracking-tight">Empty schedule. Relax or book events!</p>
        </div>
      )}

      {/* Subsequent Reminders Queue */}
      <div className="space-y-3 flex-1 flex flex-col justify-end">
        {remainingList.length > 0 && (
          <>
            <h5 className="text-[12px] font-bold text-zinc-400 uppercase tracking-widest mb-2 border-b border-zinc-100 pb-2">Later</h5>
            {remainingList.map((reminder) => (
              <div
                key={reminder.id}
                className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-100 hover:border-zinc-200 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center flex-shrink-0 text-zinc-500">
                  <Clock size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[15px] font-bold text-zinc-900 truncate tracking-tight">
                    {reminder.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getReminderTypeStyles(reminder.reminder_type)}`}>
                      {reminder.reminder_type}
                    </span>
                    <span className="text-[12px] font-medium text-zinc-500">
                      {getRelativeTime(reminder.reminder_date)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </motion.div>
  );
});
