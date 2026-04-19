import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  UserPlus, 
  Trash2, 
  Database, 
  ShieldAlert, 
  Mail,
  MoreVertical,
  Key,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { adminPromoteToAdmin } from '@/lib/supabase';
import { toast } from 'sonner';

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
      // Logic for promotion usually needs the UUID, 
      // but we can look it up in a real implementation.
      // For now, we'll assume the admin knows what they are doing.
      toast.info("Searching for identity...");
      // In a real flow, we'd lookup UUID from email first.
      // But we will implement the logic in UserRegistry for safer context.
      toast.error("Delegation must be performed via the User Registry 'Inspect' tool for security verification.");
    } catch (err) {
      toast.error("Failed to promote user.");
    } finally {
      setPromoting(false);
    }
  };

  return (
    <div className="space-y-10 pb-20 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-left"
      >
        <h1 className="display-hero text-apple-near-black dark:text-white">Command.</h1>
        <p className="text-[21px] text-apple-near-black/60 dark:text-white/60 tracking-apple-tight">
          System delegation and master project maintenance.
        </p>
      </motion.div>

      <div className="space-y-6">
        {/* Admin Delegation */}
        <motion.div 
          className="apple-card p-10 bg-white dark:bg-apple-near-black border border-black/5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-4 mb-8">
             <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                <UserPlus size={24} />
             </div>
             <div>
                <h3 className="text-xl font-bold dark:text-white">Admin Delegation</h3>
                <p className="text-[14px] text-apple-near-black/40 font-medium">Grant full system access to a trusted peer.</p>
             </div>
          </div>

          <div className="flex gap-4">
             <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-apple-near-black/30" size={18} />
                <input 
                  type="email"
                  placeholder="Peer's email address..."
                  value={promoEmail}
                  onChange={e => setPromoEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-black/5 dark:bg-white/5 border-none focus:ring-2 focus:ring-purple-500/20 font-medium"
                />
             </div>
             <button 
               onClick={handlePromote}
               disabled={promoting}
               className="px-8 rounded-2xl bg-apple-blue text-white font-bold hover:scale-[1.02] transition-transform shadow-lg shadow-apple-blue/20"
             >
               {promoting ? "Processing..." : "Grant Power"}
             </button>
          </div>
          
          <div className="mt-8 p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-4">
             <ShieldAlert className="text-amber-500 mt-1" size={18} />
             <p className="text-[12px] text-amber-600 leading-relaxed font-medium">
                IMPORTANT: New admins will have full power to delete applications, manage users, and promote others. Only delegate to verified coordinators.
             </p>
          </div>
        </motion.div>

        {/* Master Database Tools */}
        <motion.div 
          className="apple-card p-10 bg-white dark:bg-apple-near-black border border-black/5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-4 mb-8">
             <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
                <Database size={24} />
             </div>
             <div>
                <h3 className="text-xl font-bold dark:text-white">Project Maintenance</h3>
                <p className="text-[14px] text-apple-near-black/40 font-medium">Reset system state or purge legacy data.</p>
             </div>
          </div>

          <div className="space-y-4">
             <div className="p-6 rounded-2xl border border-black/5 flex items-center justify-between group hover:bg-rose-500/5 transition-all">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center text-apple-near-black/40"><Zap size={20} /></div>
                   <div>
                      <h4 className="font-bold dark:text-white">Clear Application Cache</h4>
                      <p className="text-[12px] opacity-40">Optimize search indexing and clear temporary files.</p>
                   </div>
                </div>
                <button className="px-4 py-2 rounded-lg bg-black/5 font-bold text-[12px] hover:bg-black/10">Execute</button>
             </div>

             <div className="p-6 rounded-2xl border border-rose-500/20 bg-rose-500/[0.02] flex items-center justify-between group">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500"><Trash2 size={20} /></div>
                   <div>
                      <h4 className="font-bold text-rose-500">Master Data Wipe</h4>
                      <p className="text-[12px] text-rose-500/60 font-medium">Irreversibly delete all internship applications across all users.</p>
                   </div>
                </div>
                <button 
                  onClick={() => {
                     if (confirm("MASTER ALERT: This will delete EVERY internship application in the database. This cannot be undone. Are you absolutely certain?")) {
                       toast.error("Maintenance locked. Manual database access required for master wipe.");
                     }
                  }}
                  className="px-4 py-2 rounded-lg bg-rose-500 text-white font-bold text-[12px] shadow-lg shadow-rose-500/20"
                >
                  PURGE SYSTEM
                </button>
             </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
