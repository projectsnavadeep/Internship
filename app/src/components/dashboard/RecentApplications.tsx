import { motion } from 'framer-motion';
import { Building2, ChevronRight } from 'lucide-react';
import type { Application } from '@/types';
import { memo } from 'react';

interface RecentApplicationsProps {
  applications: Application[];
}

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Offer': return 'bg-apple-blue/10 text-apple-blue border-apple-blue/20';
    case 'Applied': return 'bg-apple-gray dark:bg-zinc-800 text-apple-near-black/70 dark:text-white/70 border-black/5 dark:border-white/5';
    case 'Interview': 
    case 'Phone Screen':
    case 'Technical': return 'bg-apple-near-black text-white dark:bg-white dark:text-apple-near-black border-transparent';
    case 'Rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
    default: return 'bg-apple-gray dark:bg-zinc-800 text-apple-near-black/40 dark:text-white/40 border-black/5 dark:border-white/5';
  }
};

export const RecentApplications = memo(function RecentApplications({ applications }: RecentApplicationsProps) {
  const recent = applications.slice(0, 5);

  return (
    <motion.div
      className="apple-card p-8 bg-white dark:bg-apple-near-black apple-card-lift"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-[21px] font-semibold text-apple-near-black dark:text-white tracking-apple-tight">
          Recent Activity
        </h3>
        <motion.button
          className="text-[14px] font-bold text-apple-blue flex items-center gap-1 group"
        >
          View All
          <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </div>

      <div className="space-y-4">
        {recent.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-apple-gray dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4 text-apple-near-black/10">
              <Building2 size={32} />
            </div>
            <p className="text-[15px] font-medium text-apple-near-black/30 dark:text-white/30 tracking-apple-tight">No recent activity detected.</p>
          </div>
        ) : (
          recent.map((app, index) => (
            <motion.div
              key={app.id}
              className="flex items-center gap-5 p-4 rounded-3xl bg-apple-gray/50 dark:bg-zinc-900 shadow-sm border border-black/5 dark:border-white/5 group hover:bg-apple-blue/[0.03] transition-all duration-300"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + index * 0.1 }}
            >
              {/* Icon Container */}
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-apple-near-black flex items-center justify-center flex-shrink-0 shadow-sm text-apple-near-black dark:text-white group-hover:scale-110 transition-transform">
                <Building2 size={24} strokeWidth={1.5} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-[17px] font-bold text-apple-near-black dark:text-white truncate tracking-apple-tight">
                  {app.company_name}
                </h4>
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-[12px] font-bold text-apple-near-black/30 dark:text-white/30 uppercase tracking-widest">{app.job_title}</span>
                  <span className="w-1 h-1 rounded-full bg-apple-near-black/10 dark:bg-white/10" />
                  <span className="text-[12px] font-bold text-apple-near-black/30 dark:text-white/30 uppercase tracking-widest">
                    {new Date(app.applied_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Status */}
              <span className={`px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getStatusStyles(app.status)}`}>
                {app.status}
              </span>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
});
