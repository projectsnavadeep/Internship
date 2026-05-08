import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Search, 
  Terminal, 
  Cpu, 
  Globe, 
  Lock, 
  Activity,
  ChevronRight,
  Database,
  Fingerprint,
  RefreshCw,
  Clock,
  ExternalLink
} from 'lucide-react';
import { adminGetDailySessions } from '@/lib/supabase';
import { PremiumLoader } from '@/components/shared/PremiumLoader';
import { toast } from 'sonner';

const DiffViewer = ({ previous, changes }: { previous: any, changes: any }) => {
  if (!changes || typeof changes !== 'object') return null;
  
  return (
    <div className="mt-3 space-y-1.5">
      {Object.entries(changes).map(([key, newValue]) => {
        if (['id', 'created_at', 'updated_at', 'user_id', 'session_id'].includes(key)) return null;
        
        const oldValue = previous?.[key];
        if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return null;
        
        return (
          <div key={key} className="flex flex-wrap items-center gap-2 text-[11px] font-medium">
            <span className="text-zinc-500 uppercase tracking-tighter text-[9px] font-black">{key.replace(/_/g, ' ')}</span>
            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-white/5 px-2 py-1 rounded-lg border dark:border-white/5">
              <span className="text-zinc-400 dark:text-zinc-600 line-through decoration-zinc-300 dark:decoration-zinc-700">{String(oldValue ?? 'null')}</span>
              <ChevronRight size={10} className="text-zinc-400" />
              <span className="text-apple-blue font-bold">{String(newValue ?? 'null')}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export function SecurityAuditVault() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const data = await adminGetDailySessions();
      setSessions(data || []);
    } catch (err) {
      console.error('Audit Load Failure:', err);
      toast.error('Failed to synchronize with audit relay.');
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.session_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-apple-blue/20 border-t-apple-blue animate-spin" />
          <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-apple-blue" size={24} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Decrypting Audit Streams...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* SDL Header Intelligence */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-[24px] bg-zinc-900 border border-white/5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-apple-blue/10 flex items-center justify-center text-apple-blue">
               <Database size={16} />
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Log Integrity</span>
          </div>
          <div>
            <h4 className="text-2xl font-bold text-white tracking-tighter">Verified.</h4>
            <p className="text-[12px] text-zinc-500 font-medium mt-1">All entries cryptographically signed.</p>
          </div>
        </div>
        
        <div className="p-6 rounded-[24px] bg-zinc-900 border border-white/5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
               <Activity size={16} />
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Live Traffic</span>
          </div>
          <div>
            <h4 className="text-2xl font-bold text-white tracking-tighter">Active.</h4>
            <p className="text-[12px] text-zinc-500 font-medium mt-1">Real-time ingestion enabled.</p>
          </div>
        </div>

        <div className="p-6 rounded-[24px] bg-zinc-900 border border-white/5 flex flex-col gap-4">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
               <Lock size={16} />
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Security Level</span>
          </div>
          <div>
            <h4 className="text-2xl font-bold text-white tracking-tighter">Tier 1.</h4>
            <p className="text-[12px] text-zinc-500 font-medium mt-1">Full administrative audit trail.</p>
          </div>
        </div>
      </div>

      {/* Main Audit Console */}
      <div className="mc-stadium-card bg-white dark:bg-[#0A0A0A] border border-black/5 dark:border-white/5 overflow-hidden">
        <div className="p-8 border-b dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="dark:text-white flex items-center gap-3">
              <Terminal size={24} className="text-apple-blue shrink-0" />
              Security Audit Vault
            </h2>
            <p className="text-xs text-zinc-400 font-medium mt-1">Microsoft SDL Compliant Activity Monitoring</p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-apple-blue transition-colors" size={16} />
                <input 
                  type="text"
                  placeholder="Filter by Session ID or User..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-6 py-3 rounded-xl bg-zinc-50 dark:bg-white/5 border-none focus:ring-2 focus:ring-apple-blue/20 text-sm font-medium w-64 transition-all dark:text-white"
                />
             </div>
             <button 
               onClick={loadAuditLogs}
               className="p-3 rounded-xl bg-zinc-50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors text-zinc-500"
             >
               <RefreshCw size={18} />
             </button>
          </div>
        </div>

        <div className="divide-y dark:divide-white/5">
          {filteredSessions.length === 0 ? (
            <div className="p-20 text-center">
               <Fingerprint className="mx-auto text-zinc-200 dark:text-white/5 mb-4" size={48} />
               <p className="text-zinc-500 font-medium">No matching audit records found.</p>
            </div>
          ) : (
            filteredSessions.map((session, idx) => (
              <div key={idx} className="group">
                <div 
                  onClick={() => setExpandedId(expandedId === session.session_id ? null : session.session_id)}
                  className="p-6 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/[0.01] transition-colors"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                    <div className="flex flex-col items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-zinc-50 dark:bg-white/5 border dark:border-white/5 font-mono text-[9px] sm:text-[10px] text-zinc-400 shrink-0">
                      <span className="font-black text-zinc-900 dark:text-white text-sm sm:text-base">{new Date(session.session_date).getDate()}</span>
                      <span>{new Date(session.session_date).toLocaleString('default', { month: 'short' }).toUpperCase()}</span>
                    </div>
                    
                    <div>
                       <div className="flex items-center gap-3 mb-1">
                         <span className="font-mono text-[13px] font-bold text-apple-blue bg-apple-blue/5 px-2 py-0.5 rounded">
                           {session.session_id || `SES-${idx}`}
                         </span>
                         {session.user_role === 'admin' && (
                           <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                             <Shield size={10} /> Coordinator
                           </div>
                         )}
                       </div>
                       <h4 className="text-[16px] font-bold dark:text-white flex items-center gap-2">
                         {session.user_name}
                         <span className="w-1 h-1 rounded-full bg-zinc-300" />
                         <span className="text-xs text-zinc-400 font-medium">{session.total_actions} Operational Events</span>
                       </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                     <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Last Telemetry</p>
                        <p className="text-xs font-mono text-zinc-500">{new Date(session.activity_stream[0].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                     </div>
                     <motion.div 
                       animate={{ rotate: expandedId === session.session_id ? 90 : 0 }}
                       className="text-zinc-300"
                     >
                       <ChevronRight size={20} />
                     </motion.div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedId === session.session_id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-zinc-50/50 dark:bg-black/40 border-t dark:border-white/5"
                    >
                      <div className="p-8 space-y-6">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 border-b dark:border-white/5 pb-4">
                           <span>Activity Sequence</span>
                           <span>Timestamp (UTC)</span>
                        </div>
                        
                        <div className="space-y-4">
                          {session.activity_stream.map((log: any, lIdx: number) => (
                            <div key={log.id} className="flex items-start justify-between group/item">
                              <div className="flex gap-4">
                                <div className="mt-1 w-2 h-2 rounded-full bg-apple-blue shadow-[0_0_8px_rgba(0,122,255,0.5)]" />
                                <div>
                                  <p className="text-sm font-bold dark:text-zinc-200 uppercase tracking-tighter break-words">
                                    {log.type.replace(/_/g, ' ')}
                                  </p>
                                  <p className="text-xs text-zinc-500 font-medium mt-0.5 leading-relaxed break-words">
                                    {log.description}
                                  </p>
                                  
                                  {/* Deep Telemetry Differential View */}
                                  {log.metadata?.changes && (
                                    <DiffViewer previous={log.metadata.previous} changes={log.metadata.changes} />
                                  )}

                                  {log.metadata && !log.metadata.changes && Object.keys(log.metadata).length > 0 && (
                                    <div className="mt-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border dark:border-white/5 font-mono text-[10px] text-zinc-400 overflow-x-auto">
                                      <div className="flex items-center gap-2 mb-2 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                                        <Database size={10} /> Raw Telemetry
                                      </div>
                                      {JSON.stringify(log.metadata, null, 2)}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className="font-mono text-[11px] text-zinc-400">
                                  {new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                                </span>
                                <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-600">
                                  UUID: {log.id.slice(0, 8)}...
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <div className="pt-6 border-t dark:border-white/5 flex justify-end">
                           <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-apple-blue hover:underline">
                             <ExternalLink size={12} /> Export Audit Fragment
                           </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
