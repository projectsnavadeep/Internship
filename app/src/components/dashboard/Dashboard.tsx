import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, 
  Send, 
  MessageSquare, 
  Award, 
  Clock,
  AlertCircle,
  X,
  ChevronRight,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { StatsCard } from './StatsCard';
import { StatusChart } from './StatusChart';
import { MonthlyChart } from './MonthlyChart';
import { RecentApplications } from './RecentApplications';
import { UpcomingReminders } from './UpcomingReminders';
import type { Application, ApplicationStats, Reminder, Profile } from '@/types';

interface DashboardProps {
  applications: Application[];
  reminders: Reminder[];
  stats: ApplicationStats;
  profile?: Profile | null;
  onNavigate?: (tab: string) => void;
}

export function Dashboard({ applications, reminders, stats, profile, onNavigate }: DashboardProps) {
  const [statusData, setStatusData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [upcomingAlerts, setUpcomingAlerts] = useState<Reminder[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  useEffect(() => {
    // 1. Calculate upcoming alerts (next 24 hours)
    const now = new Date();
    const next24 = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const alerts = reminders.filter(r => {
      const rDate = new Date(r.reminder_date);
      return !r.is_completed && rDate > now && rDate <= next24 && !dismissedAlerts.includes(r.id);
    });
    setUpcomingAlerts(alerts);

    // 2. Calculate status distribution
    const statusCounts: Record<string, number> = {};
    applications.forEach(app => {
      statusCounts[app.status] = (statusCounts[app.status] || 0) + 1;
    });

    const colors: Record<string, string> = {
      'Applied': '#141413', 
      'Phone Screen': '#CF4500', 
      'Interview': '#CF4500',
      'Technical': '#CF4500',
      'Offer': '#FCFBFA', 
      'Rejected': '#EB001B',
      'Withdrawn': '#86868b',
      'Ghosted': '#F3F0EE',
    };

    setStatusData(
      Object.entries(statusCounts).map(([name, value]) => ({
        name,
        value,
        color: colors[name] || '#86868b',
      }))
    );

    // 3. Calculate monthly data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyCounts: Record<string, number> = {};
    months.forEach(month => { monthlyCounts[month] = 0; });

    applications.forEach(app => {
      const date = new Date(app.applied_date);
      const month = months[date.getMonth()];
      monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
    });

    setMonthlyData(months.map(month => ({ month, count: monthlyCounts[month] })));
  }, [applications, reminders, dismissedAlerts]);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-12">
      {/* 24h Notification Banner */}
      <AnimatePresence>
        {upcomingAlerts.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: 24 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-[32px] p-6 md:p-8 flex items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
                  <AlertCircle size={32} />
                </div>
                <div>
                  <h4 className="text-[20px] font-bold text-amber-700 leading-tight">Incoming Schedule</h4>
                  <p className="text-[15px] text-amber-700/60 font-medium">
                    You have <span className="text-amber-700 font-bold">{upcomingAlerts[0].title}</span> in {Math.round((new Date(upcomingAlerts[0].reminder_date).getTime() - new Date().getTime()) / (1000 * 60))} minutes.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {/* Trigger scroll to reminders or tab change */}}
                  className="px-6 py-3 rounded-full bg-amber-500 text-white font-bold text-[14px] shadow-lg shadow-amber-500/20 flex items-center gap-2 hover:scale-[1.02] transition-transform"
                >
                  View Prep
                  <ChevronRight size={16} />
                </button>
                <button 
                  onClick={() => setDismissedAlerts(prev => [...prev, upcomingAlerts[0].id])}
                  className="w-12 h-12 rounded-full border border-amber-500/20 flex items-center justify-center text-amber-500/40 hover:text-amber-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="text-left py-12 md:py-20 max-w-4xl"
      >
        <h1 className="text-[64px] md:text-[88px] font-medium tracking-mc-tight leading-[0.95] text-mc-ink-black dark:text-white mb-6">
          {getTimeGreeting()},<br />
          <span className="text-apple-blue font-bold">
            {(profile?.full_name || 'there').split(' ')[0]}
          </span>
        </h1>
        <p className="text-[24px] text-mc-ink-black/60 dark:text-white/60 tracking-mc-tight max-w-2xl font-medium">
          {stats.total_applications > 0 
            ? `You've tracked ${stats.total_applications} opportunities. You have ${stats.interview_count} interviews pending.`
            : 'Your journey starts here. Add your first application to see insights.'}
        </p>
      </motion.div>

      {/* Empty State / Engagement Screen */}
      {stats.total_applications === 0 && (
        <motion.div
           className="mc-stadium-card bg-mc-lifted-cream p-8 md:p-16 border border-mc-ink-black/10 flex flex-col md:flex-row items-center gap-12 mb-16 overflow-hidden relative"
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
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

      {/* Stats Grid - Data driven layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Pipeline Total"
          value={stats.total_applications}
          icon={<Briefcase className="w-6 h-6" />}
          color="#141413"
          delay={0}
        />
        <StatsCard
          title="Active Applied"
          value={stats.applied_count}
          icon={<Send className="w-6 h-6" />}
          color="#141413"
          delay={0.1}
        />
        <StatsCard
          title="Under Review"
          value={stats.interview_count}
          icon={<MessageSquare className="w-6 h-6" />}
          color="#CF4500"
          delay={0.2}
        />
        <StatsCard
          title="Total Offers"
          value={stats.offer_count}
          icon={<Award className="w-6 h-6" />}
          color="#10b981"
          delay={0.3}
        />
      </div>

      {/* Charts Row */}
      {stats.total_applications > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <StatusChart data={statusData} />
          <MonthlyChart data={monthlyData} />
        </div>
      )}

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentApplications applications={applications} />
        <UpcomingReminders reminders={reminders} />
      </div>

      {/* Dynamic Insights */}
      <motion.div
        className="mc-stadium-card bg-mc-ink-black text-mc-canvas-cream p-6 md:p-16 relative overflow-hidden"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
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
            {
              icon: <Clock className="w-8 h-8" />,
              title: 'Follow-Up Pattern',
              description: 'Consistency is your edge. Professional follow-ups should trigger 7 days post-apply.',
              color: 'text-apple-blue',
            },
            {
              icon: <TrendingUp className="w-8 h-8" />,
              title: 'Market Research',
              description: 'Look beyond technical specs. Understand their funding stage and team growth trajectory.',
              color: 'text-mc-canvas-cream',
            },
            {
              icon: <Award className="w-8 h-8" />,
              title: 'Personal Pitch',
              description: 'Refine your narrative. Every interview is a chance to sharpen your core message.',
              color: 'text-apple-blue',
            },
          ].map((tip, index) => (
            <motion.div
              key={tip.title}
              className="flex flex-col text-center items-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <div className={`mb-8 ${tip.color}`}>
                {tip.icon}
              </div>
              <h4 className="text-[28px] font-medium tracking-mc-tight mb-4">{tip.title}</h4>
              <p className="text-[18px] leading-relaxed text-mc-canvas-cream/60 font-medium">{tip.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
