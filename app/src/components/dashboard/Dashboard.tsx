import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Briefcase, 
  Send, 
  MessageSquare, 
  Award, 
  Clock,
  Target
} from 'lucide-react';
import { StatsCard } from './StatsCard';
import { StatusChart } from './StatusChart';
import { MonthlyChart } from './MonthlyChart';
import { RecentApplications } from './RecentApplications';
import { UpcomingReminders } from './UpcomingReminders';
import type { Application, ApplicationStats, Reminder } from '@/types';

interface DashboardProps {
  applications: Application[];
  reminders: Reminder[];
  stats: ApplicationStats;
}

export function Dashboard({ applications, reminders, stats }: DashboardProps) {
  const [statusData, setStatusData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    // Calculate status distribution
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

    // Calculate monthly data
    const monthlyCounts: Record<string, number> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize all months with 0
    months.forEach(month => {
      monthlyCounts[month] = 0;
    });

    applications.forEach(app => {
      const date = new Date(app.applied_date);
      const month = months[date.getMonth()];
      monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
    });

    setMonthlyData(
      months.map(month => ({
        month,
        count: monthlyCounts[month],
      }))
    );
  }, [applications]);

  return (
    <div className="space-y-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="text-left py-12 md:py-20 max-w-4xl"
      >
        <div className="mc-eyebrow flex items-center gap-2 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-mc-light-signal-orange" />
          YOUR PORTFOLIO
        </div>
        <h1 className="text-[64px] md:text-[88px] font-medium tracking-mc-tight leading-[0.95] text-mc-ink-black dark:text-white mb-6">
          Welcome to<br />InternTrack.
        </h1>
        <p className="text-[24px] text-mc-ink-black/60 dark:text-white/60 tracking-mc-tight max-w-2xl">
          Your journey to the perfect internship, elegantly organized and optimized.
        </p>
      </motion.div>

      {/* Empty State / Welcome Screen */}
      {stats.total_applications === 0 && (
        <motion.div
           className="mc-stadium-card bg-mc-lifted-cream p-8 md:p-16 border border-mc-ink-black/10 text-center mb-16"
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center mx-auto mb-8 border border-mc-ink-black/5 shadow-sm">
            <Briefcase size={40} className="text-mc-signal-orange" />
          </div>
          <h3 className="text-[32px] font-medium tracking-mc-tight text-mc-ink-black mb-4">Blank Canvas</h3>
          <p className="text-[20px] text-mc-ink-black/60 mb-8 max-w-md mx-auto">
            Head over to the Applications tab to add your first job prospect.
          </p>
        </motion.div>
      )}

      {/* Stats Grid - Asymmetrical editorial sizes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Applications"
          value={stats.total_applications}
          icon={<Briefcase className="w-6 h-6" />}
          color="#141413"
          trend="up"
          trendValue="+12%"
          delay={0}
        />
        <StatsCard
          title="Applied"
          value={stats.applied_count}
          icon={<Send className="w-6 h-6" />}
          color="#141413"
          delay={0.1}
        />
        <StatsCard
          title="In Interview"
          value={stats.interview_count}
          icon={<MessageSquare className="w-6 h-6" />}
          color="#CF4500"
          delay={0.2}
        />
        <StatsCard
          title="Offers"
          value={stats.offer_count}
          icon={<Award className="w-6 h-6" />}
          color="#CF4500"
          trend="up"
          trendValue="+2"
          delay={0.3}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <StatusChart data={statusData} />
        <MonthlyChart data={monthlyData} />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentApplications applications={applications} />
        <UpcomingReminders reminders={reminders} />
      </div>

      {/* Quick Tips - Mastercard Magazine Style */}
      <motion.div
        className="mc-stadium-card bg-mc-ink-black text-mc-canvas-cream p-6 md:p-16 relative overflow-hidden"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        {/* Decorative circle backdrop */}
        <div className="absolute top-[-50%] right-[-10%] w-[800px] h-[800px] rounded-full bg-white/5 blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center text-center mb-16 relative z-10">
          <div className="mc-eyebrow flex items-center gap-2 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-mc-signal-orange" />
            INSIGHTS
          </div>
          <h3 className="text-[48px] md:text-[64px] font-medium tracking-mc-tight leading-none mb-2">Pro Tips for Success</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative z-10">
          {[
            {
              icon: <Clock className="w-8 h-8" />,
              title: 'The Follow-Up',
              description: 'Consistency is key. Send a polite follow-up exactly 7 days after application.',
              color: 'text-mc-signal-orange',
            },
            {
              icon: <Target className="w-8 h-8" />,
              title: 'Deep Research',
              description: 'Go beyond the website. Understand their engineering culture and recent news.',
              color: 'text-mc-canvas-cream',
            },
            {
              icon: <Award className="w-8 h-8" />,
              title: 'Negotiation',
              description: 'Valuing your work matters. Always review and negotiate compensation with confidence.',
              color: 'text-mc-signal-orange',
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
              <p className="text-[18px] leading-relaxed text-mc-canvas-cream/60">{tip.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
