import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Briefcase, 
  Activity, 
  TrendingUp, 
  ArrowUpRight,
  Loader2,
  Clock
} from 'lucide-react';
import { 
  adminGetStats, 
  adminGetRecentApplications 
} from '@/lib/supabase';
import type { AdminStats, AdminRecentApplication } from '@/types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

export function AdminOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentApps, setRecentApps] = useState<AdminRecentApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [s, r] = await Promise.all([
        adminGetStats(),
        adminGetRecentApplications(),
      ]);
      setStats(s);
      setRecentApps(r);
    } catch (err) {
      console.error('Failed to load overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 size={40} className="animate-spin text-apple-blue" />
        <p className="text-apple-near-black/40 dark:text-white/40 font-medium">Crunching system data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-left"
      >
        <h1 className="display-hero text-apple-near-black dark:text-white">Overview.</h1>
        <p className="text-[21px] text-apple-near-black/60 dark:text-white/60 tracking-apple-tight">
          System performance and real-time activity tracking.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Students', value: stats?.totalUsers || 0, icon: <Users size={20} />, color: 'bg-blue-500' },
          { label: 'Active Applications', value: stats?.totalApplications || 0, icon: <Briefcase size={20} />, color: 'bg-indigo-500' },
          { label: 'Recent Active', value: stats?.activeUsersLast7Days || 0, icon: <Activity size={20} />, color: 'bg-orange-500' },
          { label: 'Offer Rate', value: `${stats?.offerRate || 0}%`, icon: <TrendingUp size={20} />, color: 'bg-emerald-500' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="apple-card p-6 bg-white dark:bg-apple-near-black border border-black/5 dark:border-white/5 shadow-sm"
          >
            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center text-white mb-4 shadow-lg opacity-90`}>
              {stat.icon}
            </div>
            <p className="text-[13px] font-bold text-apple-near-black/30 dark:text-white/30 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-3xl font-bold mt-1 dark:text-white">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity List */}
        <motion.div 
          className="lg:col-span-2 apple-card p-8 bg-white dark:bg-apple-near-black"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
              <Clock className="text-indigo-500" size={20} />
              Recent Applications
            </h3>
          </div>
          <div className="space-y-4">
            {recentApps.slice(0, 5).map((app) => (
              <div key={app.id} className="flex items-center justify-between p-4 rounded-2xl bg-black/3 dark:bg-white/3 group hover:bg-apple-blue/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center border border-black/5">
                    <Briefcase size={18} className="text-apple-blue" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[15px] dark:text-white">{app.company_name}</h4>
                    <p className="text-[12px] text-apple-near-black/40 dark:text-white/40">{app.applicant_name} · {app.job_title}</p>
                  </div>
                </div>
                <div className="text-right">
                   <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-apple-blue/10 text-apple-blue">
                    {app.status}
                   </span>
                   <p className="text-[11px] mt-1 text-apple-near-black/30">{new Date(app.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Mini Stats Chart Placeholder */}
        <motion.div 
          className="apple-card p-8 bg-white dark:bg-apple-near-black"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
           <h3 className="text-xl font-bold dark:text-white mb-8">Conversion</h3>
           <div className="h-[200px] flex items-center justify-center border-2 border-dashed border-black/5 rounded-3xl">
              <div className="text-center">
                <p className="text-4xl font-bold text-apple-blue">{stats?.offerRate || 0}%</p>
                <p className="text-xs font-bold text-apple-near-black/40 uppercase tracking-widest mt-2">Success Rate</p>
              </div>
           </div>
           <p className="mt-6 text-sm text-apple-near-black/40 leading-relaxed italic">
             "Total success metrics across all internship pipelines."
           </p>
        </motion.div>
      </div>
    </div>
  );
}
