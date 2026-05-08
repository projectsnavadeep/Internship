import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Briefcase, 
  Activity, 
  TrendingUp, 

  Shield,
  Zap,
  Terminal,
  Globe,
  Radio
} from 'lucide-react';
import { 
  adminGetStats, 
  adminGetRecentApplications 
} from '@/lib/supabase';
import type { AdminStats, AdminRecentApplication } from '@/types';
import { PremiumLoader } from '@/components/shared/PremiumLoader';




// Radar component for visual trace
const RadarScanner = ({ activeUsers = 0 }: { activeUsers?: number }) => {
  return (
    <div className="relative w-full h-48 bg-zinc-50 dark:bg-white/[0.02] rounded-3xl border border-black/5 dark:border-white/5 overflow-hidden flex items-center justify-center">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,113,227,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,113,227,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
      
      {/* Radar rings */}
      <div className="relative w-32 h-32 rounded-full border border-apple-blue/10 flex items-center justify-center">
        <div className="w-24 h-24 rounded-full border border-apple-blue/20 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border border-apple-blue/30" />
        </div>
        
        {/* Sweep */}
        <motion.div 
          className="absolute top-1/2 left-1/2 w-1/2 h-1/2 origin-top-left bg-[conic-gradient(from_0deg,rgba(0,113,227,0.2)_0deg,transparent_90deg)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
        
        {/* Axis lines */}
        <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-apple-blue/5" />
        <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-apple-blue/5" />
        
        {/* Random blips */}
        <motion.div 
          className="absolute top-4 left-10 w-1.5 h-1.5 bg-apple-blue rounded-full shadow-[0_0_8px_rgba(0,113,235,1)]"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 1 }}
        />
        <motion.div 
          className="absolute bottom-6 right-8 w-1.5 h-1.5 bg-apple-blue rounded-full shadow-[0_0_8px_rgba(0,113,235,1)]"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
        />
      </div>
      
      <div className="absolute bottom-4 right-6 text-right">
        <p className="text-[10px] font-black text-apple-near-black/30 dark:text-white/30 uppercase tracking-widest mb-1">Active Trace</p>
        <p className="text-xl font-bold dark:text-white">{activeUsers} NODES</p>
      </div>
    </div>
  );
};


interface AdminOverviewProps {
  onNavigate?: (tab: string) => void;
}

export function AdminOverview({ onNavigate }: AdminOverviewProps) {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentApps, setRecentApps] = useState<AdminRecentApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState('PRDX-...');

  useEffect(() => {
    let storedId = sessionStorage.getItem('admin_trace_session_id');
    if (!storedId) {
      storedId = `PRDX-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      sessionStorage.setItem('admin_trace_session_id', storedId);
    }
    setSessionId(storedId);
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
        <PremiumLoader message="Syncing Core Datastream..." size="md" />
      </div>
    );
  }

  return (
    <>

      <div className="space-y-12 pb-20">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-left relative flex items-center justify-between border-b dark:border-white/5 pb-8"
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Master Level Access</span>
            </div>
            <h1 className="text-[64px] md:text-[80px] font-semibold tracking-tighter leading-none text-zinc-900 dark:text-white mb-4">
              Admin Control.
            </h1>
            <p className="text-[20px] text-zinc-500 dark:text-white/40 tracking-tight font-medium">
              Real-time platform telemetry and global student activity.
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-6">
            <div className="text-right">
               <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">Session ID</p>
               <p className="text-xs font-mono dark:text-white/60">{sessionId}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center border border-black/5 dark:border-white/5">
              <Globe size={20} className="text-apple-blue" />
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { label: 'Total Students', value: stats?.totalUsers || 0, icon: <Users size={22} />, color: 'from-blue-500 to-indigo-600', delay: 0.1 },
            { label: 'Pipeline Vol', value: stats?.totalApplications || 0, icon: <Briefcase size={22} />, color: 'from-violet-500 to-purple-600', delay: 0.2 },
            { label: 'Live Traffic', value: stats?.activeUsersLast7Days || 0, icon: <Activity size={22} />, color: 'from-emerald-500 to-teal-600', delay: 0.3 },
            { label: 'Yield Success', value: `${stats?.offerRate || 0}%`, icon: <TrendingUp size={22} />, color: 'from-orange-500 to-rose-600', delay: 0.4 },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: stat.delay, type: 'spring', damping: 15 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="apple-card p-8 bg-white dark:bg-apple-near-black border border-black/5 dark:border-white/5 shadow-sm group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/[0.02] dark:to-white/[0.02]" />
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-500/10 relative z-10 transition-transform group-hover:scale-110 duration-300`}>
                {stat.icon}
              </div>
              <p className="text-[12px] font-black text-apple-near-black/40 dark:text-white/40 uppercase tracking-[0.2em] mb-2 relative z-10">{stat.label}</p>
              <h3 className="text-4xl font-extrabold dark:text-white tracking-tighter relative z-10">
                {stat.value}
              </h3>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Live Activity Console */}
          <motion.div 
            className="lg:col-span-2 apple-card overflow-hidden bg-white dark:bg-apple-near-black border border-black/5 dark:border-white/5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="p-8 border-b dark:border-white/5 flex items-center justify-between bg-zinc-50/50 dark:bg-white/[0.02]">
              <h3 className="text-lg font-bold dark:text-white flex items-center gap-3">
                <Terminal className="text-apple-blue" size={20} />
                Live Ingestion Stream
              </h3>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 animate-pulse">
                Socket Active
              </div>
            </div>
            <div className="divide-y dark:divide-white/5">
              {recentApps.slice(0, 7).map((app, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + (idx * 0.1) }}
                  className="flex items-center justify-between p-6 hover:bg-apple-blue/[0.02] transition-colors group"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-apple-blue transition-colors border border-black/5 dark:border-white/10 font-mono text-xs">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-[15px] dark:text-white group-hover:translate-x-1 transition-transform">
                        {app.company_name} <span className="text-zinc-400 font-medium">· {app.job_title}</span>
                      </h4>
                      <p className="text-[12px] text-zinc-400 flex items-center gap-2 mt-0.5 uppercase tracking-widest font-black">
                        <Users size={12} /> {app.applicant_name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                     <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-white/5">
                       {app.status}
                     </span>
                     <p className="text-[11px] mt-2 font-mono text-zinc-400">{new Date(app.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <button 
              onClick={() => onNavigate?.('security')}
              className="w-full py-4 bg-zinc-50 dark:bg-white/[0.02] border-t dark:border-white/5 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-apple-blue transition-colors cursor-pointer"
            >
              View Full Audit Log
            </button>
          </motion.div>

          <div className="space-y-10">
            {/* System Integrity */}
            <motion.div 
              className="apple-card p-8 bg-zinc-900 border-zinc-800 text-white relative overflow-hidden"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-apple-blue/20 blur-[60px] rounded-full -mr-16 -mt-16" />
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                <Shield className="text-apple-blue" size={24} />
                System Health
              </h3>
              
              <div className="space-y-6">
                {[
                  { label: 'Database Sync', status: 'Stable', pc: 98 },
                  { label: 'Auth Middleware', status: 'Active', pc: 100 },
                  { label: 'Storage Cluster', status: 'Optimal', pc: 92 },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-xs font-black uppercase tracking-widest opacity-40">{item.label}</span>
                       <span className="text-[10px] font-bold text-apple-blue">{item.status}</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                         className="h-full bg-apple-blue"
                         initial={{ width: 0 }}
                         animate={{ width: `${item.pc}%` }}
                         transition={{ delay: 1 + (i * 0.2), duration: 1 }}
                       />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Performance Node / Radar */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between px-2">
                <h3 className="text-lg font-bold dark:text-white flex items-center gap-3">
                  <Radio size={20} className="text-zinc-400" />
                  Live Trace
                </h3>
                <span className="text-[10px] font-black text-apple-blue uppercase tracking-widest">Scanning...</span>
              </div>
              <RadarScanner activeUsers={stats?.activeUsersLast7Days} />
            </motion.div>

            <motion.div 
              className="p-6 rounded-[24px] bg-apple-blue/5 border border-apple-blue/10 flex items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              <div className="w-10 h-10 rounded-xl bg-apple-blue/20 flex items-center justify-center text-apple-blue">
                <Zap size={20} />
              </div>
              <p className="text-xs font-medium text-apple-blue/80 italic leading-relaxed">
                "Platform wide metrics are updated every 60 seconds with instant callback triggers."
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
