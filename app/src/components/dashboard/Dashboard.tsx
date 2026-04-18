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
      'Applied': '#0071e3', // apple-blue
      'Phone Screen': '#0066cc',
      'Interview': '#1d1d1f',
      'Technical': '#434345',
      'Offer': '#0071e3',
      'Rejected': '#d2d2d7',
      'Withdrawn': '#86868b',
      'Ghosted': '#f5f5f7',
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
      {/* Header - Apple Hero Style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="text-center py-12"
      >
        <h1 className="display-hero text-apple-near-black dark:text-white mb-4">
          Welcome to InternTrack.
        </h1>
        <p className="text-[21px] text-apple-near-black/60 dark:text-white/60 tracking-apple-tight max-w-2xl mx-auto">
          Your journey to the perfect internship, organized and optimized.
        </p>
      </motion.div>

      {/* Empty State / Welcome Screen */}
      {stats.total_applications === 0 && (
        <motion.div
           className="apple-card p-12 bg-white dark:bg-apple-near-black border-2 border-dashed border-black/5 dark:border-white/5 text-center mb-12"
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 rounded-full bg-apple-gray dark:bg-zinc-800 flex items-center justify-center mx-auto mb-6 text-apple-blue shadow-inner">
            <Briefcase size={32} />
          </div>
          <h3 className="section-heading text-apple-near-black dark:text-white mb-2">No applications yet</h3>
          <p className="text-[17px] text-apple-near-black/40 dark:text-white/40 mb-8 max-w-sm mx-auto">
            Head over to the Applications tab to add your first job application and start tracking.
          </p>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Applications"
          value={stats.total_applications}
          icon={<Briefcase className="w-5 h-5" />}
          color="#0071e3"
          trend="up"
          trendValue="+12%"
          delay={0}
        />
        <StatsCard
          title="Applied"
          value={stats.applied_count}
          icon={<Send className="w-5 h-5" />}
          color="#1d1d1f"
          delay={0.1}
        />
        <StatsCard
          title="In Interview"
          value={stats.interview_count}
          icon={<MessageSquare className="w-5 h-5" />}
          color="#1d1d1f"
          delay={0.2}
        />
        <StatsCard
          title="Offers"
          value={stats.offer_count}
          icon={<Award className="w-5 h-5" />}
          color="#0071e3"
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

      {/* Quick Tips - Apple Feature Comparison Style */}
      <motion.div
        className="apple-card p-10 bg-white dark:bg-apple-near-black"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex flex-col items-center text-center mb-12">
          <h3 className="section-heading text-apple-near-black dark:text-white mb-2">Pro Tips for Success</h3>
          <div className="w-12 h-1 bg-apple-blue rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            {
              icon: <Clock className="w-6 h-6" />,
              title: 'The Follow-Up',
              description: 'Consistency is key. Send a polite follow-up exactly 7 days after application.',
              color: 'text-apple-blue',
            },
            {
              icon: <Target className="w-6 h-6" />,
              title: 'Deep Research',
              description: 'Go beyond the website. Understand their engineering culture and recent news.',
              color: 'text-apple-near-black dark:text-white',
            },
            {
              icon: <Award className="w-6 h-6" />,
              title: 'Negotiation',
              description: 'Valuing your work matters. Always review and negotiate compensation with confidence.',
              color: 'text-apple-blue',
            },
          ].map((tip, index) => (
            <motion.div
              key={tip.title}
              className="flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <div className={`mb-6 p-4 rounded-full bg-apple-gray dark:bg-zinc-800 ${tip.color}`}>
                {tip.icon}
              </div>
              <h4 className="text-[19px] font-semibold text-apple-near-black dark:text-white mb-3">{tip.title}</h4>
              <p className="text-[15px] leading-relaxed text-apple-near-black/50 dark:text-white/50">{tip.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
