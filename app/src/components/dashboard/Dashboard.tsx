import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, 
  Send, 
  MessageSquare, 
  Award, 
  Clock,
  AlertCircle,
  X,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { StatsCard } from './StatsCard';
import { StatusChart } from './StatusChart';
import { MonthlyChart } from './MonthlyChart';
import { RecentApplications } from './RecentApplications';
import { UpcomingReminders } from './UpcomingReminders';
import { DashboardSkeleton } from '../shared/ViewSkeletons';
import { DashboardSessionTimer } from './DashboardSessionTimer';
import type { Application, ApplicationStats, Reminder, Profile } from '@/types';

interface DashboardProps {
  applications: Application[];
  reminders: Reminder[];
  stats: ApplicationStats;
  profile?: Profile | null;
  onNavigate?: (tab: string) => void;
  loading?: boolean;
}

export function Dashboard({ applications, reminders, stats, profile, onNavigate, loading }: DashboardProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  // Memoized calculations to prevent lag
  const { statusData, monthlyData, upcomingAlerts } = useMemo(() => {
    // 1. Calculate upcoming alerts (next 24 hours)
    const now = new Date();
    const next24 = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const alerts = reminders.filter(r => {
      const rDate = new Date(r.reminder_date);
      return !r.is_completed && rDate > now && rDate <= next24 && !dismissedAlerts.includes(r.id);
    });

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

    const sData = Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
      color: colors[name] || '#86868b',
    }));

    // 3. Calculate monthly data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyCounts: Record<string, number> = {};
    months.forEach(month => { monthlyCounts[month] = 0; });

    applications.forEach(app => {
      const date = new Date(app.applied_date);
      const month = months[date.getMonth()];
      monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
    });

    const mData = months.map(month => ({ month, count: monthlyCounts[month] }));

    return { statusData: sData, monthlyData: mData, upcomingAlerts: alerts };
  }, [applications, reminders, dismissedAlerts]);

  if (loading) return <DashboardSkeleton />;

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-8 will-change-transform">
      {/* 24h Notification Banner */}
      <AnimatePresence>
        {upcomingAlerts.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 md:p-4 flex items-center justify-between gap-4 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h4 className="text-[16px] font-bold text-amber-700 leading-tight">Incoming Schedule</h4>
                  <p className="text-[13px] text-amber-700/60 font-medium">
                    <span className="text-amber-700 font-bold">{upcomingAlerts[0].title}</span> in {' '}
                    {(() => {
                      const mins = Math.round((new Date(upcomingAlerts[0].reminder_date).getTime() - new Date().getTime()) / (1000 * 60));
                      if (mins < 60) return `${mins} mins`;
                      const h = Math.floor(mins / 60);
                      const m = mins % 60;
                      return `${h}h ${m}m`;
                    })()}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setDismissedAlerts(prev => [...prev, upcomingAlerts[0].id])}
                className="w-8 h-8 rounded-full border border-amber-500/20 flex items-center justify-center text-amber-500/40 hover:text-amber-500 transition-colors shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-left py-8 md:pt-4 md:pb-12 max-w-4xl transform-gpu"
      >
        <div className="space-y-6">
          <h1 className="mb-6 leading-tight">
            {getTimeGreeting()},<br />
            <span className="text-apple-blue">
              {(profile?.full_name || 'there').split(' ')[0]}.
            </span>
          </h1>
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            <p className="text-[24px] text-apple-near-black/50 dark:text-white/40 tracking-tight font-medium">
              {stats.total_applications > 0 
                ? `${stats.total_applications} opportunities tracked. ${stats.interview_count} interviews pending.`
                : 'Your journey starts here. Add your first application to see insights.'}
            </p>
            
            <DashboardSessionTimer 
              userId={profile?.id} 
              initialToday={profile?.today_minutes_spent || 0}
              initialTotal={profile?.total_minutes_spent || 0}
            />
          </div>
        </div>
      </motion.div>

      {/* Empty State / Engagement Screen */}
      {stats.total_applications === 0 && (
        <motion.div
           className="mc-stadium-card bg-mc-lifted-cream p-8 md:p-16 border border-mc-ink-black/10 flex flex-col md:flex-row items-center gap-12 mb-16 overflow-hidden relative"
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-apple-blue/5 blur-2xl pointer-events-none will-change-[filter]" />
          
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-[32px] md:rounded-[40px] bg-white flex items-center justify-center border border-mc-ink-black/5 shadow-sm shrink-0">
            <Sparkles size={48} className="text-apple-blue md:w-16 md:h-16" />
          </div>
          <div className="text-center md:text-left flex-1">
            <h3 className="text-[32px] md:text-[40px] font-medium tracking-mc-tight text-mc-ink-black mb-4 leading-tight">Ready for Launch.</h3>
            <p className="text-[18px] md:text-[22px] text-mc-ink-black/60 mb-8 max-w-xl">
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
        <div className="absolute top-[-50%] right-[-10%] w-[800px] h-[800px] rounded-full bg-white/5 blur-2xl pointer-events-none will-change-[filter]" />

        <div className="flex flex-col items-center text-center mb-16 relative z-10">
          <div className="mc-eyebrow flex items-center gap-2 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-apple-blue" />
            STRATEGIC GUIDANCE
          </div>
          <h2 className="text-white mb-2">
            {stats.offer_count > 0 ? 'Next: Negotiation' : stats.interview_count > 0 ? 'Prep: Interviewing' : 'Focus: Applications'}
          </h2>
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
