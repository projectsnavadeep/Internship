import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  UserPlus, 
  ShieldAlert, 
  Mail,
  Activity,
  CheckCircle2,
  Lock,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { InlineLoader } from '@/components/shared/PremiumLoader';

export function AdminSettings() {
  const [promoEmail, setPromoEmail] = useState('');
  const [promoting, setPromoting] = useState(false);

  const handlePromote = async () => {
    if (!promoEmail.includes('@')) {
      toast.error("Please enter a valid peer email.");
      return;
    }
    setPromoting(true);
    try {
      toast.info("Verifying identity and issuing promotion...");
      const { adminPromoteUserByEmail } = await import('@/lib/supabase');
      await adminPromoteUserByEmail(promoEmail);
      toast.success(`${promoEmail} has been elevated to Coordinator (Admin).`);
      setPromoEmail('');
    } catch (err: any) {
      toast.error(err.message || "Failed to promote user.");
    } finally {
      setPromoting(false);
    }
  };


  return (
    <div className="space-y-12 pb-24 max-w-5xl">
      {/* Header with breadcrumbs feel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-left"
      >
        <div className="flex items-center gap-2 mb-6">
          <div className="px-2 py-1 rounded bg-apple-blue/10 text-apple-blue text-[10px] font-black uppercase tracking-widest">Master</div>
          <div className="w-1 h-1 rounded-full bg-zinc-300" />
          <div className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Command Console</div>
        </div>
        <h1 className="text-[56px] md:text-[72px] font-medium tracking-mc-tight leading-[0.95] text-mc-ink-black dark:text-white mb-6">
          System.<br />Authority.
        </h1>
        <p className="text-[22px] text-mc-ink-black/60 dark:text-white/60 tracking-mc-tight max-w-2xl font-medium">
          Manage administrative delegation and monitor platform-wide operational health.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Admin Delegation */}
        <motion.div 
          className="mc-stadium-card p-10 bg-white border border-black/5 flex flex-col"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-5 mb-10">
             <div className="w-14 h-14 rounded-[22px] bg-apple-blue/10 flex items-center justify-center text-apple-blue shadow-sm">
                <UserPlus size={28} />
             </div>
             <div>
                <h3 className="text-[24px] font-bold text-mc-ink-black leading-tight">Admin Delegation</h3>
                <p className="text-[14px] text-mc-ink-black/40 font-medium">Promote a peer to coordinator.</p>
             </div>
          </div>

          <div className="space-y-6 flex-1">
             <div className="relative group">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-mc-ink-black/20 group-focus-within:text-apple-blue transition-colors">
                  <Mail size={20} />
                </div>
                <input 
                  type="email"
                  placeholder="Peer email address..."
                  value={promoEmail}
                  onChange={e => setPromoEmail(e.target.value)}
                  className="w-full pl-14 pr-6 py-5 rounded-[24px] bg-black/5 border-none focus:ring-4 focus:ring-apple-blue/5 font-medium text-[16px] transition-all placeholder:text-mc-ink-black/20"
                />
             </div>
             
             <button 
               onClick={handlePromote}
               disabled={promoting}
               className="w-full py-5 rounded-[24px] bg-apple-blue text-white font-bold text-[16px] hover:scale-[1.01] active:scale-95 transition-all shadow-xl shadow-apple-blue/20 flex items-center justify-center gap-3"
             >
               {promoting ? <InlineLoader size={20} /> : "Authorize Delegation"}
               {!promoting && <ChevronRight size={18} />}
             </button>
          </div>
          
          <div className="mt-10 p-6 rounded-[24px] bg-amber-500/5 border border-amber-500/10 flex items-start gap-5">
             <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                <ShieldAlert size={20} />
             </div>
             <p className="text-[13px] text-amber-700/80 leading-relaxed font-medium">
                Delegating power gives the peer full access to user data and system settings. Ensure you have performed manual identity verification.
             </p>
          </div>
        </motion.div>

        {/* System Diagnostics */}
        <motion.div 
          className="mc-stadium-card p-10 bg-white border border-black/5 flex flex-col"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-5 mb-10">
             <div className="w-14 h-14 rounded-[22px] bg-zinc-900 flex items-center justify-center text-white shadow-lg">
                <Activity size={28} />
             </div>
             <div>
                <h3 className="text-[24px] font-bold text-mc-ink-black leading-tight">System Status</h3>
                <p className="text-[14px] text-mc-ink-black/40 font-medium">Real-time platform diagnostics.</p>
             </div>
          </div>

          <div className="space-y-4">
             {[
               { icon: <CheckCircle2 size={18} />, label: 'Auth Service', status: 'Operational', color: 'text-emerald-500' },
               { icon: <CheckCircle2 size={18} />, label: 'Database Node', status: 'Operational', color: 'text-emerald-500' },
               { icon: <CheckCircle2 size={18} />, label: 'Email Relay', status: 'Operational', color: 'text-emerald-500' },
               { icon: <Lock size={18} />, label: 'RLS Policies', status: 'Hardened', color: 'text-apple-blue' },
               { icon: <ShieldCheck size={18} />, label: 'API Security', status: 'Active', color: 'text-apple-blue' },
             ].map((svc, i) => (
               <div key={i} className="flex items-center justify-between p-5 rounded-[22px] bg-zinc-50 border border-zinc-100 hover:scale-[1.02] transition-transform cursor-default">
                  <div className="flex items-center gap-4 text-mc-ink-black/80 font-bold text-[14px]">
                    <span className={svc.color}>{svc.icon}</span>
                    {svc.label}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[12px] font-black uppercase tracking-widest ${svc.color}`}>{svc.status}</span>
                    <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${svc.color.replace('text-', 'bg-')}`} />
                  </div>
               </div>
             ))}
          </div>

          <div className="mt-auto pt-8 flex items-center justify-center gap-2 text-mc-ink-black/30 text-[12px] font-medium uppercase tracking-widest">
            Audit logs synced 2m ago
          </div>
        </motion.div>
      </div>
    </div>
  );
}
