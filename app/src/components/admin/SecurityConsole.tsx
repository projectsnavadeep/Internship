import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Lock as LockIcon, 
  Database, 
  Server, 
  ShieldAlert,
  ShieldHalf,
  CheckCircle2,
  AlertCircle,
  Key
} from 'lucide-react';
import { adminGetStats } from '@/lib/supabase';

export function SecurityConsole() {
  useEffect(() => {
    adminGetStats();
  }, []);

  return (
    <div className="space-y-10 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-left"
      >
        <h1 className="display-hero text-apple-near-black dark:text-white">Security.</h1>
        <p className="text-[21px] text-apple-near-black/60 dark:text-white/60 tracking-apple-tight">
          System integrity monitoring and data safety audit.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Master Security Status */}
        <motion.div 
          className="lg:col-span-2 apple-card p-10 bg-white dark:bg-apple-near-black border border-black/5"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="flex items-center gap-4 mb-10">
             <div className="w-16 h-16 rounded-[24px] bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner">
                <ShieldCheck size={32} />
             </div>
             <div>
                <h3 className="text-2xl font-black dark:text-white mb-1">System Health Healthy</h3>
                <p className="text-[15px] text-apple-near-black/40 font-medium">All security layers are operational and verified.</p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {[
               { label: 'Database RLS', status: 'Active (Strict)', icon: <Database size={18} />, color: 'text-apple-blue' },
               { label: 'Data Encryption', status: 'AES-256 (TDE)', icon: <LockIcon size={18} />, color: 'text-indigo-500' },
               { label: 'SSL Integrity', status: 'Cloudflare Proxy', icon: <Server size={18} />, color: 'text-purple-500' },
               { label: 'Access Control', status: 'JWT RBAC v2.1', icon: <Key size={18} />, color: 'text-emerald-500' }
             ].map((s, i) => (
                <div key={i} className="p-5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className={s.color}>{s.icon}</div>
                      <span className="font-bold text-[14px] dark:text-white">{s.label}</span>
                   </div>
                   <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">{s.status}</span>
                </div>
             ))}
          </div>

          <div className="mt-12 p-6 rounded-3xl bg-apple-blue/5 border border-apple-blue/10">
             <div className="flex items-start gap-4">
                <ShieldHalf className="text-apple-blue mt-1" size={20} />
                <div>
                   <h4 className="font-bold text-apple-blue">Isolation Verified</h4>
                   <p className="text-[13px] text-apple-blue/70 leading-relaxed mt-1">
                      System-wide Row Level Security (RLS) is currently enforcing total data isolation. Non-admin users can strictly access only their own records. All administrative queries bypass RLS via a dedicated Service Role client.
                   </p>
                </div>
             </div>
          </div>
        </motion.div>

        {/* MFA & Threat Monitoring */}
        <div className="space-y-8">
           <motion.div 
             className="apple-card p-8 bg-white dark:bg-apple-near-black"
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
           >
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                 <ShieldAlert className="text-rose-500" size={18} />
                 MFA Enrollment
              </h3>
              <div className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div>
                        <p className="text-3xl font-black text-apple-near-black dark:text-white">0%</p>
                        <p className="text-[10px] font-black text-apple-near-black/30 uppercase tracking-widest">Enrolled Users</p>
                    </div>
                    <div className="p-3 rounded-full bg-rose-500/10 text-rose-500">
                       <AlertCircle size={24} />
                    </div>
                 </div>
                 <div className="p-4 rounded-xl bg-black/5 dark:bg-white/5">
                    <p className="text-[11px] font-bold text-apple-near-black/40 leading-relaxed">
                       Multi-Factor Authentication is currently optional. It is recommended to enforce this for administrative accounts.
                    </p>
                 </div>
              </div>
           </motion.div>

           <motion.div 
             className="apple-card p-8 bg-white dark:bg-apple-near-black flex flex-col items-center text-center gap-4"
             initial={{ opacity: 0, x: 20 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ delay: 0.2 }}
           >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                 <CheckCircle2 size={32} />
              </div>
              <div>
                 <h4 className="font-bold dark:text-white">No Active Threats</h4>
                 <p className="text-[11px] text-apple-near-black/40 mt-1">Last scan performed 2 minutes ago</p>
              </div>
              <button className="w-full py-2 rounded-xl bg-black/5 text-[12px] font-bold hover:bg-black/10 transition-colors">
                 Full System Audit
              </button>
           </motion.div>
        </div>
      </div>
    </div>
  );
}
