import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Briefcase } from 'lucide-react';
import type { Application, Reminder } from '@/types';

interface CalendarViewProps {
  applications: Application[];
  reminders: Reminder[];
}

export function CalendarView({ applications, reminders }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    
    const apps = applications.filter(app => {
      if (app.applied_date === dateStr) return true;
      if (app.deadline_date === dateStr) return true;
      if (app.interview_date) {
        const interviewDate = new Date(app.interview_date).toISOString().split('T')[0];
        return interviewDate === dateStr;
      }
      return false;
    });

    const rems = reminders.filter(reminder => {
      const reminderDate = new Date(reminder.reminder_date).toISOString().split('T')[0];
      return reminderDate === dateStr;
    });

    return { applications: apps, reminders: rems };
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : { applications: [], reminders: [] };

  const calendarDays = useMemo(() => {
    const days: { date: number; isCurrentMonth: boolean; dateObj: Date }[] = [];

    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({
        date: daysInPrevMonth - i,
        isCurrentMonth: false,
        dateObj: new Date(year, month - 1, daysInPrevMonth - i),
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: i,
        isCurrentMonth: true,
        dateObj: new Date(year, month, i),
      });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: i,
        isCurrentMonth: false,
        dateObj: new Date(year, month + 1, i),
      });
    }

    return days;
  }, [year, month, firstDayOfMonth, daysInMonth, daysInPrevMonth]);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDate?.toDateString() === date.toDateString();
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="text-left"
      >
        <h1 className="display-hero text-apple-near-black dark:text-white mb-2">Calendar.</h1>
        <p className="text-[21px] text-apple-near-black/60 dark:text-white/60 tracking-apple-tight">
          Synchronize your professional timeline.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Card */}
        <motion.div
          className="lg:col-span-2 apple-card p-8 bg-white dark:bg-apple-near-black apple-card-lift"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-[24px] font-bold text-apple-near-black dark:text-white tracking-apple-tight">
              {monthNames[month]} {year}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="w-10 h-10 rounded-full bg-apple-gray dark:bg-zinc-800 flex items-center justify-center text-apple-near-black/40 dark:text-white/40 hover:text-apple-blue transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextMonth}
                className="w-10 h-10 rounded-full bg-apple-gray dark:bg-zinc-800 flex items-center justify-center text-apple-near-black/40 dark:text-white/40 hover:text-apple-blue transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-7 gap-px bg-black/5 dark:bg-white/5 rounded-2xl overflow-hidden border border-black/5 dark:border-white/5">
            {dayNames.map(day => (
              <div key={day} className="bg-apple-gray dark:bg-zinc-900/50 py-4 text-center text-[11px] font-bold text-apple-near-black/30 dark:text-white/30 uppercase tracking-[0.2em]">
                {day}
              </div>
            ))}
            {calendarDays.map((day, index) => {
              const events = getEventsForDate(day.dateObj);
              const hasEvents = events.applications.length > 0 || events.reminders.length > 0;

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(day.dateObj)}
                  className={`
                    relative min-h-[100px] p-2 flex flex-col items-center justify-start transition-all bg-white dark:bg-apple-near-black group
                    ${!day.isCurrentMonth ? 'opacity-20' : 'opacity-100'}
                    ${isSelected(day.dateObj) ? 'bg-apple-blue/5 z-10' : ''}
                  `}
                >
                   {isSelected(day.dateObj) && (
                     <motion.div layoutId="calendar-selection" className="absolute inset-x-1 inset-y-1 bg-apple-blue rounded-xl -z-0" transition={{ type: 'spring', damping: 25, stiffness: 300 }} />
                   )}
                   
                   <span className={`relative z-10 text-[15px] font-bold py-1.5 px-3 rounded-full mt-1 ${
                     isSelected(day.dateObj) ? 'text-white' : 
                     isToday(day.dateObj) ? 'bg-apple-blue text-white shadow-sm' : 
                     'text-apple-near-black dark:text-white'
                   }`}>
                     {day.date}
                   </span>
                  
                  {hasEvents && !isSelected(day.dateObj) && (
                    <div className="flex flex-wrap items-center justify-center gap-1 mt-auto pb-2 relative z-10 px-1">
                      {events.applications.slice(0, 3).map((_, i) => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-apple-blue" />
                      ))}
                      {events.reminders.slice(0, 3).map((_, i) => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-apple-near-black/20 dark:bg-white/20" />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-8 mt-10 pt-6 border-t border-black/5 dark:border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-apple-blue" />
              <span className="text-[14px] font-medium text-apple-near-black/50 dark:text-white/50">Opportunities</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-apple-near-black/40 dark:text-white/40" />
              <span className="text-[14px] font-medium text-apple-near-black/50 dark:text-white/50">Reminders</span>
            </div>
          </div>
        </motion.div>

        {/* Schedule Sidebar */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="apple-card p-8 bg-white dark:bg-apple-near-black min-h-[400px]">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-apple-blue shadow-lg shadow-apple-blue/20 flex items-center justify-center text-white">
                <CalendarIcon size={20} />
              </div>
              <h3 className="text-[21px] font-bold text-apple-near-black dark:text-white tracking-apple-tight">
                Schedule.
              </h3>
            </div>

            <AnimatePresence mode="wait">
              {selectedDate ? (
                <motion.div
                  key={selectedDate.toISOString()}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <p className="text-[15px] font-bold text-apple-blue uppercase tracking-widest">
                    {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>

                  <div className="space-y-4">
                    {selectedDateEvents.applications.length > 0 && (
                      <div className="space-y-3">
                        {selectedDateEvents.applications.map((app) => (
                          <div key={app.id} className="p-5 rounded-2xl bg-apple-gray dark:bg-zinc-900 border-none group hover:bg-apple-blue/[0.03] transition-colors">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-lg bg-white dark:bg-apple-near-black flex items-center justify-center text-apple-blue">
                                <Briefcase size={16} />
                              </div>
                              <span className="text-[15px] font-bold text-apple-near-black dark:text-white">{app.company_name}</span>
                            </div>
                            <p className="text-[14px] text-apple-near-black/50 dark:text-white/50 font-medium pl-11">{app.job_title}</p>
                            {app.interview_date && new Date(app.interview_date).toISOString().split('T')[0] === selectedDate.toISOString().split('T')[0] && (
                              <div className="flex items-center gap-2 mt-3 pl-11">
                                <Clock size={14} className="text-apple-blue" />
                                <span className="text-[12px] font-bold text-apple-blue uppercase tracking-wider">
                                  Interview at {new Date(app.interview_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedDateEvents.reminders.length > 0 && (
                      <div className="space-y-3">
                        {selectedDateEvents.reminders.map((reminder) => (
                          <div key={reminder.id} className="p-5 rounded-2xl bg-apple-gray dark:bg-zinc-900 border-none">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-8 h-8 rounded-lg bg-white dark:bg-apple-near-black flex items-center justify-center text-apple-near-black/40">
                                <Clock size={16} />
                              </div>
                              <span className="text-[15px] font-bold text-apple-near-black dark:text-white">{reminder.title}</span>
                            </div>
                            {reminder.description && (
                              <p className="text-[14px] font-medium text-apple-near-black/40 pl-11">{reminder.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedDateEvents.applications.length === 0 && selectedDateEvents.reminders.length === 0 && (
                      <div className="text-center py-20">
                        <div className="w-16 h-16 rounded-full bg-apple-gray dark:bg-zinc-900 flex items-center justify-center mx-auto mb-4 text-apple-near-black/10">
                          <Clock size={32} strokeWidth={1} />
                        </div>
                        <p className="text-[15px] font-medium text-apple-near-black/30 dark:text-white/30">Nothing scheduled for this day.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="text-center py-20">
                  <div className="w-16 h-16 rounded-full bg-apple-gray dark:bg-zinc-900 flex items-center justify-center mx-auto mb-4 text-apple-near-black/10">
                    <CalendarIcon size={32} strokeWidth={1} />
                  </div>
                  <p className="text-[17px] font-medium text-apple-near-black/30 dark:text-white/30 px-6">Select a date from the calendar to view your schedule.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
