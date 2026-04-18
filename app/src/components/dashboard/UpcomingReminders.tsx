import { motion } from 'framer-motion';
import { Calendar, Clock, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import type { Reminder } from '@/types';

interface UpcomingRemindersProps {
  reminders: Reminder[];
}

const getReminderTypeStyles = (type: string) => {
  switch (type) {
    case 'Deadline': return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'Interview': return 'bg-apple-blue/10 text-apple-blue border-apple-blue/20';
    case 'Follow-up': return 'bg-apple-gray dark:bg-zinc-800 text-apple-near-black/70 dark:text-white/70 border-black/5 dark:border-white/5';
    default: return 'bg-apple-gray dark:bg-zinc-800 text-apple-near-black/40 dark:text-white/40 border-black/5 dark:border-white/5';
  }
};

export function UpcomingReminders({ reminders }: UpcomingRemindersProps) {
  const upcoming = reminders.slice(0, 5);

  const getRelativeTime = (date: string) => {
    const now = new Date();
    const reminderDate = new Date(date);
    const diffMs = reminderDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `${diffDays} days`;
    return reminderDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <motion.div
      className="apple-card p-8 bg-white dark:bg-apple-near-black apple-card-lift"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-[21px] font-semibold text-apple-near-black dark:text-white tracking-apple-tight">
          Reminders
        </h3>
        <motion.button
          className="text-[14px] font-bold text-apple-blue flex items-center gap-1 group"
        >
          Manage
          <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </div>

      <div className="space-y-4">
        {upcoming.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-apple-gray dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4 text-apple-near-black/10">
              <CheckCircle2 size={32} />
            </div>
            <p className="text-[15px] font-medium text-apple-near-black/30 dark:text-white/30 tracking-apple-tight">No pending tasks.</p>
          </div>
        ) : (
          upcoming.map((reminder, index) => (
            <motion.div
              key={reminder.id}
              className="flex items-center gap-5 p-4 rounded-3xl bg-apple-gray/30 dark:bg-zinc-900 shadow-sm border border-black/5 dark:border-white/5 group hover:bg-apple-blue/[0.03] transition-all duration-300"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
            >
              {/* Type Icon */}
              <div className="w-11 h-11 rounded-2xl bg-white dark:bg-apple-near-black flex items-center justify-center flex-shrink-0 shadow-sm text-apple-near-black dark:text-white">
                <Clock size={20} strokeWidth={1.5} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-[15px] font-bold text-apple-near-black dark:text-white truncate tracking-apple-tight">
                  {reminder.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getReminderTypeStyles(reminder.reminder_type)}`}>
                    {reminder.reminder_type}
                  </span>
                  <span className="text-[12px] font-bold text-apple-near-black/20 dark:text-white/20 uppercase tracking-widest pl-1">
                    {getRelativeTime(reminder.reminder_date)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
