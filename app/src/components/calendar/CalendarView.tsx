import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Briefcase, Plus, X, Trash2 } from 'lucide-react';
import { InlineLoader } from '@/components/shared/PremiumLoader';
import { toast } from 'sonner';
import { createReminder, updateReminder, deleteReminder, logError } from '@/lib/supabase';
import { CalendarSkeleton } from '../shared/ViewSkeletons';
import type { Application, Reminder } from '@/types';

interface CalendarViewProps {
  applications: Application[];
  reminders: Reminder[];
  userId?: string;
  onRefresh?: () => void;
  loading?: boolean;
}

export function CalendarView({ applications, reminders, userId, onRefresh, loading }: CalendarViewProps) {
  if (loading) return <CalendarSkeleton />;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    time: '09:00',
    type: 'Interview',
    description: ''
  });

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
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toLocaleDateString('en-CA'); // 'YYYY-MM-DD' local time
    
    const apps = applications.filter(app => {
      if (app.applied_date && new Date(app.applied_date).toLocaleDateString('en-CA') === dateStr) return true;
      if (app.deadline_date && new Date(app.deadline_date).toLocaleDateString('en-CA') === dateStr) return true;
      if (app.interview_date) {
        const interviewDate = new Date(app.interview_date).toLocaleDateString('en-CA');
        return interviewDate === dateStr;
      }
      return false;
    });

    const rems = reminders.filter(reminder => {
      const reminderDate = new Date(reminder.reminder_date).toLocaleDateString('en-CA');
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

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;
    
    try {
      setIsSubmitting(true);
      const [hours, minutes] = eventForm.time.split(':').map(Number);
      
      const reminderDate = new Date(selectedDate);
      reminderDate.setHours(hours, minutes, 0, 0);

      if (editingReminder) {
        await updateReminder(editingReminder.id, {
          title: eventForm.title,
          description: eventForm.description,
          reminder_type: eventForm.type as any,
          reminder_date: reminderDate.toISOString()
        });
        toast.success('Event updated successfully');
      } else {
        await createReminder({
          user_id: userId,
          title: eventForm.title,
          description: eventForm.description,
          reminder_type: eventForm.type as any,
          reminder_date: reminderDate.toISOString()
        });
        toast.success('Event scheduled successfully');
      }

      setShowEventModal(false);
      setEditingReminder(null);
      setEventForm({ title: '', time: '09:00', type: 'Interview', description: '' });
      if (onRefresh) onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to process event');
      logError({
        errorType: 'application_update',
        errorMessage: error.message || 'Reminder processing failed',
        errorStack: error.stack,
        actionAttempted: editingReminder ? 'update_reminder' : 'create_reminder',
        userId: userId,
        source: 'frontend'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (reminder: Reminder) => {
    const date = new Date(reminder.reminder_date);
    const time = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    
    setEditingReminder(reminder);
    setEventForm({
      title: reminder.title,
      time: time,
      type: reminder.reminder_type,
      description: reminder.description || ''
    });
    setShowEventModal(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await deleteReminder(id);
      toast.success('Event deleted');
      if (onRefresh) onRefresh();
    } catch (error: any) {
      toast.error('Failed to delete event');
      logError({
        errorType: 'application_delete',
        errorMessage: error.message || 'Reminder deletion failed',
        errorStack: error.stack,
        actionAttempted: 'handleDeleteClick',
        userId: userId,
        source: 'frontend'
      });
    }
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
        <h1 className="text-[64px] md:text-[80px] font-semibold tracking-tighter leading-none text-zinc-900 dark:text-white mb-4">
          Calendar.
        </h1>
        <p className="text-[20px] text-apple-near-black/50 dark:text-white/40 font-medium tracking-tight">
          Synchronize your professional timeline.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Calendar Grid */}
        <motion.div
          className="xl:col-span-2 mc-stadium-card p-4 md:p-10 bg-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-[28px] font-medium tracking-tight text-zinc-900">
              {monthNames[month]} {year}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-all border border-zinc-200"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={nextMonth}
                className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-all border border-zinc-200"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-7 gap-px bg-zinc-200 rounded-2xl overflow-hidden border border-zinc-200">
            {dayNames.map(day => (
              <div key={day} className="bg-zinc-50 py-4 text-center text-[12px] font-semibold text-zinc-500 uppercase tracking-widest">
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
                    relative min-h-[80px] md:min-h-[120px] p-2 flex flex-col items-center justify-start transition-all group
                    ${!day.isCurrentMonth ? 'bg-zinc-100/50 text-zinc-400' : 'bg-white text-zinc-900'}
                    ${isSelected(day.dateObj) ? 'bg-zinc-100 z-10' : 'hover:bg-zinc-50'}
                  `}
                >
                   {isSelected(day.dateObj) && (
                     <motion.div layoutId="calendar-selection" className="absolute inset-1 border-2 border-zinc-900 rounded-xl pointer-events-none" transition={{ type: 'spring', damping: 25, stiffness: 300 }} />
                   )}
                   
                   <span className={`relative z-10 text-[16px] font-medium py-1.5 px-3 rounded-full mt-2 transition-colors ${
                     isToday(day.dateObj) ? 'bg-zinc-900 text-white shadow-sm' : ''
                   }`}>
                     {day.date}
                   </span>
                  
                  {hasEvents && !isSelected(day.dateObj) && (
                    <div className="flex flex-wrap items-center justify-center gap-1.5 mt-auto pb-3 relative z-10 px-1">
                      {events.applications.slice(0, 3).map((_, i) => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#CF4500]" />
                      ))}
                      {events.reminders.slice(0, 3).map((_, i) => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Schedule Sidebar */}
        <motion.div
          className="space-y-6 flex flex-col h-full"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="mc-stadium-card p-6 md:p-10 bg-white flex-1 flex flex-col relative overflow-hidden">
            <AnimatePresence mode="wait">
              {!showEventModal ? (
                <motion.div
                  key="schedule-view"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col h-full"
                >
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-900">
                        <CalendarIcon size={24} />
                      </div>
                      <h3 className="text-[28px] font-medium text-zinc-900 tracking-tight">
                        Schedule
                      </h3>
                    </div>
                    {selectedDate && (
                      <button
                        onClick={() => setShowEventModal(true)}
                        className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center hover:bg-zinc-800 transition-colors shadow-sm"
                      >
                        <Plus size={20} />
                      </button>
                    )}
                  </div>

                  {selectedDate ? (
                    <div className="flex-1 space-y-6">
                      <p className="text-[14px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-100 pb-4">
                        {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </p>

                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {selectedDateEvents.applications.length > 0 && (
                          <div className="space-y-3">
                            {selectedDateEvents.applications.map((app) => (
                              <div key={app.id} className="p-5 rounded-2xl bg-zinc-50 border border-zinc-100 group hover:border-[#CF4500]/30 transition-colors">
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-[#CF4500] shadow-sm">
                                    <Briefcase size={20} />
                                  </div>
                                  <div>
                                    <span className="block text-[16px] font-medium text-zinc-900">{app.company_name}</span>
                                    <span className="block text-[14px] text-zinc-500">{app.job_title}</span>
                                  </div>
                                </div>
                                {app.interview_date && new Date(app.interview_date).toLocaleDateString('en-CA') === selectedDate.toLocaleDateString('en-CA') && (
                                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-200/50">
                                    <Clock size={14} className="text-zinc-400" />
                                    <span className="text-[13px] font-medium text-zinc-600">
                                      Interview at {new Date(app.interview_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
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
                              <div key={reminder.id} className="p-5 rounded-2xl bg-zinc-50 border border-zinc-100 group relative">
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                  <button 
                                    onClick={() => handleEditClick(reminder)}
                                    className="p-1.5 rounded-lg bg-zinc-200/50 hover:bg-zinc-200 text-zinc-600 transition-colors"
                                  >
                                    <Clock size={14} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteClick(reminder.id)}
                                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                                <div className="flex items-center gap-3 mb-2">
                                  <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-500 shadow-sm">
                                    <Clock size={20} />
                                  </div>
                                  <div>
                                    <span className="block text-[16px] font-medium text-zinc-900">{reminder.title}</span>
                                    <span className="block text-[12px] font-bold text-zinc-400 uppercase tracking-wider">{reminder.reminder_type}</span>
                                  </div>
                                </div>
                                {reminder.description && (
                                  <p className="text-[14px] mt-3 text-zinc-600 border-t border-zinc-200/50 pt-3">{reminder.description}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {selectedDateEvents.applications.length === 0 && selectedDateEvents.reminders.length === 0 && (
                          <div className="text-center py-16">
                            <div className="w-20 h-20 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center mx-auto mb-6 text-zinc-300">
                              <CalendarIcon size={32} strokeWidth={1.5} />
                            </div>
                            <p className="text-[16px] text-zinc-500">Nothing scheduled for this day.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-20 flex-1 flex flex-col items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center mx-auto mb-6 text-zinc-300">
                        <CalendarIcon size={32} strokeWidth={1.5} />
                      </div>
                      <p className="text-[16px] text-zinc-500 px-6">Select a date to view or create events.</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="event-modal"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex flex-col h-full bg-white relative z-20"
                >
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-[24px] font-medium text-zinc-900 tracking-tight">
                      {editingReminder ? 'Edit Event' : 'New Event'}
                    </h3>
                    <button
                      onClick={() => {
                        setShowEventModal(false);
                        setEditingReminder(null);
                        setEventForm({ title: '', time: '09:00', type: 'Interview', description: '' });
                      }}
                      className="w-10 h-10 rounded-full bg-zinc-50 text-zinc-500 flex items-center justify-center hover:bg-zinc-100 transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleCreateEvent} className="space-y-6 flex-1 flex flex-col">
                    <div>
                      <label className="block text-[13px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Event Title</label>
                      <input
                        type="text"
                        required
                        value={eventForm.title}
                        onChange={e => setEventForm({...eventForm, title: e.target.value})}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-[16px]"
                        placeholder="e.g. Meta Technical Screen"
                      />
                    </div>
                    
                    <div className="space-y-6 flex-1">
                      <div>
                        <label className="block text-[13px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Time</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="time"
                            required
                            value={eventForm.time}
                            onChange={e => setEventForm({...eventForm, time: e.target.value})}
                            className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-[16px]"
                          />
                          <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200 shrink-0 h-[48px]">
                            {['AM', 'PM'].map((period) => {
                              const [h] = eventForm.time.split(':').map(Number);
                              const isPM = h >= 12;
                              const currentPeriod = isPM ? 'PM' : 'AM';
                              const isActive = currentPeriod === period;
                              
                              return (
                                <button
                                  key={period}
                                  type="button"
                                  onClick={() => {
                                    const [hours, mins] = eventForm.time.split(':').map(Number);
                                    let newHours = hours;
                                    if (period === 'PM' && hours < 12) newHours = hours + 12;
                                    if (period === 'AM' && hours >= 12) newHours = hours - 12;
                                    const formattedTime = `${newHours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
                                    setEventForm({...eventForm, time: formattedTime});
                                  }}
                                  className={`px-4 flex items-center justify-center rounded-lg text-[12px] font-bold transition-all ${
                                    isActive 
                                      ? 'bg-white text-zinc-900 shadow-sm' 
                                      : 'text-zinc-400 hover:text-zinc-600'
                                  }`}
                                >
                                  {period}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[13px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Type</label>
                        <select
                          value={eventForm.type}
                          onChange={e => setEventForm({...eventForm, type: e.target.value})}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-[16px] appearance-none"
                        >
                          <option value="Interview">Interview</option>
                          <option value="Deadline">Deadline</option>
                          <option value="Follow-up">Follow-up</option>
                          <option value="Custom">Custom</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[13px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Description / Link</label>
                      <textarea
                        rows={3}
                        value={eventForm.description}
                        onChange={e => setEventForm({...eventForm, description: e.target.value})}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-[16px] resize-none"
                        placeholder="Zoom link or notes..."
                      />
                    </div>

                    <div className="mt-auto pt-6 border-t border-zinc-100">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full relative group bg-zinc-900 border border-transparent rounded-[16px] px-6 py-3 font-medium text-center transition-all shadow-sm active:scale-95 hover:bg-zinc-800 disabled:opacity-50 overflow-hidden flex flex-col items-center justify-center h-[48px]"
                      >
                        <AnimatePresence mode="wait">
                          {isSubmitting ? (
                            <motion.div
                              key="scheduling"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="flex items-center gap-2 text-white text-[15px]"
                            >
                              <InlineLoader size={16} />
                              Scheduling...
                            </motion.div>
                          ) : (
                            <motion.div
                              key="default"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="text-white text-[15px] flex items-center justify-center w-full"
                            >
                              <span className="group-hover:-translate-x-1 transition-transform">Schedule Event</span>
                              <ChevronRight size={16} className="absolute right-4 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-zinc-400" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
