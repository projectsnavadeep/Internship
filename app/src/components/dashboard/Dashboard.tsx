import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Award,
  Clock,
  AlertCircle,
  X,
  ChevronRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { StatusChart } from './StatusChart';
import { MonthlyChart } from './MonthlyChart';
import { RecentApplications } from './RecentApplications';
import { UpcomingReminders } from './UpcomingReminders';
import { DashboardSkeleton } from '../shared/ViewSkeletons';
import type { Application, ApplicationStats, Reminder, Profile } from '@/types';

interface DashboardProps {
  applications: Application[];
  reminders: Reminder[];
  stats: ApplicationStats;
  profile?: Profile | null;
  onNavigate?: (tab: string) => void;
  loading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  'Applied': '#141413',
  'Phone Screen': '#CF4500',
  'Interview': '#CF4500',
  'Technical': '#CF4500',
  'Offer': '#10b981',
  'Rejected': '#EB001B',
  'Withdrawn': '#86868b',
  'Ghosted': '#F3F0EE',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Dashboard({ applications, reminders, stats, profile, onNavigate, loading }: DashboardProps) {
  // ── ALL HOOKS BEFORE ANY EARLY RETURN (Rules of Hooks) ──
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  // useMemo replaces the useState+useEffect pattern — no intermediate empty renders, no flicker
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    applications.forEach(app => {
      counts[app.status] = (counts[app.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      color: STATUS_COLORS[name] || '#86868b',
    }));
  }, [applications]);

  const monthlyData = useMemo(() => {
    const monthlyCounts: Record<string, number> = {};
    MONTHS.forEach(m => { monthlyCounts[m] = 0; });
    applications.forEach(app => {
      const month = MONTHS[new Date(app.applied_date).getMonth()];
      if (month) monthlyCounts[month]++;
    });
    return MONTHS.map(month => ({ month, count: monthlyCounts[month] }));
  }, [applications]);

  const upcomingAlerts = useMemo(() => {
    const now = new Date();
    const next24 = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return reminders.filter(r => {
      const rDate = new Date(r.reminder_date);
      return !r.is_completed && rDate > now && rDate <= next24 && !dismissedAlerts.includes(r.id);
    });
  }, [reminders, dismissedAlerts]);

  // Computed once at mount — hour doesn't change during a session
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  // ── EARLY RETURN AFTER ALL HOOKS ──
  if (loading) return <DashboardSkeleton />;

  const firstName = (profile?.full_name || 'there').split(' ')[0];

  return (
    <div className="space-y-12">
      {/* 24h Notification Banner */}
      <AnimatePresence>
        {upcomingAlerts.length > 0 && (
          <motion.div
            key="alert-banner"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-[20px] p-4 md:p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h4 className="text-[15px] font-bold text-amber-700 leading-tight">Incoming Schedule</h4>
                  <p className="text-[13px] text-amber-700/70 font-medium mt-0.5">
                    You have <span className="text-amber-700 font-bold">{upcomingAlerts[0].title}</span> in{' '}
                    {Math.round((new Date(upcomingAlerts[0].reminder_date).getTime() - Date.now()) / 60000)} mins.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onNavigate?.('calendar')}
                  className="px-4 py-2 rounded-full bg-amber-500 text-white font-bold text-[12px] shadow-sm shadow-amber-500/20 flex items-center gap-1.5 hover:scale-[1.02] transition-transform"
                >
                  View Prep
                  <ChevronRight size={14} />
                </button>
                <button
                  onClick={() => setDismissedAlerts(prev => [...prev, upcomingAlerts[0].id])}
                  className="w-8 h-8 rounded-full border border-amber-500/20 flex items-center justify-center text-amber-500/50 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        className="text-left !mt-2 pb-4 md:pb-6 max-w-4xl"
      >
        <h1 className="text-[64px] md:text-[80px] font-semibold tracking-tighter leading-[1.1] text-zinc-900 dark:text-white mb-2">
          {greeting},<br />
          <span className="text-apple-blue">{firstName}.</span>
        </h1>
        <p className="text-[20px] md:text-[24px] text-apple-near-black/50 dark:text-white/40 tracking-tight max-w-2xl font-medium">
          {stats.total_applications > 0
            ? `${stats.total_applications} opportunities tracked. ${stats.interview_count} interviews pending.`
            : 'Your journey starts here. Add your first application to see insights.'}
        </p>
      </motion.div>

      {/* Empty State */}
      {stats.total_applications === 0 && (
        <motion.div
          className="mc-stadium-card bg-mc-lifted-cream p-8 md:p-16 border border-mc-ink-black/10 flex flex-col md:flex-row items-center gap-12 mb-16 overflow-hidden relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-apple-blue/5 blur-3xl pointer-events-none" />
          <div className="w-32 h-32 rounded-[40px] bg-white flex items-center justify-center border border-mc-ink-black/5 shadow-sm shrink-0">
            <Sparkles size={64} className="text-apple-blue" />
          </div>
          <div className="text-center md:text-left flex-1">
            <h3 className="text-[40px] font-medium tracking-mc-tight text-mc-ink-black mb-4">Ready for Launch.</h3>
            <p className="text-[22px] text-mc-ink-black/60 mb-8 max-w-xl">
              InternTrack is your command center for professional growth. Start by logging your first internship application.
            </p>
            <button
              onClick={() => onNavigate?.('applications')}
              className="mc-pill-ink px-10 py-5 text-[18px] flex items-center gap-3 group"
            >
              Start Tracking
              <Briefcase size={22} className="group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </motion.div>
      )}


      {/* Charts */}
      {stats.total_applications > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <StatusChart data={statusData} />
          <MonthlyChart data={monthlyData} />
        </div>
      )}

      {/* Recent + Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentApplications applications={applications} />
        <UpcomingReminders reminders={reminders} />
      </div>

      {/* Strategic Guidance — plain div, no scroll animation to avoid layout thrash */}
      <div className="mc-stadium-card bg-mc-ink-black text-mc-canvas-cream p-6 md:p-16 relative overflow-hidden">
        <div className="absolute top-[-50%] right-[-10%] w-[800px] h-[800px] rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="flex flex-col items-center text-center mb-16 relative z-10">
          <div className="mc-eyebrow flex items-center gap-2 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-apple-blue" />
            STRATEGIC GUIDANCE
          </div>
          <h3 className="text-[48px] md:text-[64px] font-medium tracking-mc-tight leading-none mb-2">
            {stats.offer_count > 0 ? 'Next: Negotiation' : stats.interview_count > 0 ? 'Prep: Interviewing' : 'Focus: Applications'}
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative z-10">
          {[
            { icon: <Clock className="w-8 h-8" />, title: 'Follow-Up Pattern', description: 'Consistency is your edge. Professional follow-ups should trigger 7 days post-apply.', color: 'text-apple-blue' },
            { icon: <TrendingUp className="w-8 h-8" />, title: 'Market Research', description: 'Look beyond technical specs. Understand their funding stage and team growth trajectory.', color: 'text-mc-canvas-cream' },
            { icon: <Award className="w-8 h-8" />, title: 'Personal Pitch', description: 'Refine your narrative. Every interview is a chance to sharpen your core message.', color: 'text-apple-blue' },
          ].map(tip => (
            <div key={tip.title} className="flex flex-col text-center items-center">
              <div className={`mb-8 ${tip.color}`}>{tip.icon}</div>
              <h4 className="text-[28px] font-medium tracking-mc-tight mb-4">{tip.title}</h4>
              <p className="text-[18px] leading-relaxed text-mc-canvas-cream/60 font-medium">{tip.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
