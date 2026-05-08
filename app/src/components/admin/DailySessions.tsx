import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  ChevronDown, 
  ChevronUp, 
  User, 
  Shield, 
  Clock, 
  Activity,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { adminGetDailySessions } from '@/lib/supabase';
import { PremiumLoader } from '@/components/shared/PremiumLoader';

export function DailySessions() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await adminGetDailySessions();
      setSessions(data || []);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <PremiumLoader message="Fetching daily session data..." size="sm" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-white">
            <History size={20} />
          </div>
          <div>
            <h3 className="text-xl font-bold dark:text-white">Daily Operational Streams</h3>
            <p className="text-xs text-zinc-400 font-medium">Monitoring platform-wide user and admin sessions.</p>
          </div>
        </div>
        <button 
          onClick={loadSessions}
          className="text-[10px] font-black uppercase tracking-widest text-apple-blue hover:opacity-70 transition-opacity"
        >
          Refresh Sync
        </button>
      </div>

      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-zinc-100 dark:border-white/5 rounded-[32px]">
            <Activity className="mx-auto text-zinc-300 mb-4" size={32} />
            <p className="text-zinc-500 font-medium tracking-tight">No recorded session streams for this period.</p>
          </div>
        ) : (
          sessions.map((session, idx) => {
            const isExpanded = expandedSession === `${session.user_id}-${session.session_date}`;
            const toggleExpand = () => setExpandedSession(isExpanded ? null : `${session.user_id}-${session.session_date}`);
            
            return (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="mc-stadium-card bg-white dark:bg-white/[0.02] border border-black/5 dark:border-white/5 overflow-hidden"
              >
                <div 
                  onClick={toggleExpand}
                  className="p-6 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/[0.01] transition-colors"
                >
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-400">
                        {session.user_role === 'admin' ? <Shield size={24} className="text-apple-blue" /> : <User size={24} />}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-white dark:border-zinc-950 ${session.user_role === 'admin' ? 'bg-apple-blue' : 'bg-emerald-500'}`} />
                    </div>
                    <div>
                      <h4 className="font-bold text-[16px] dark:text-white flex items-center gap-2">
                        {session.user_name}
                        {session.user_role === 'admin' && (
                          <span className="text-[10px] font-black uppercase tracking-widest bg-apple-blue/10 text-apple-blue px-2 py-0.5 rounded">Coordinator</span>
                        )}
                      </h4>
                      <div className="flex items-center gap-3 mt-1 text-[12px] text-zinc-400 font-medium">
                        <span className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(session.session_date).toLocaleDateString()}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-300" />
                        <span className="flex items-center gap-1.5"><Activity size={12} /> {session.total_actions} Actions</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                       <p className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Last Active</p>
                       <p className="text-xs font-mono dark:text-zinc-500">{new Date(session.activity_stream[0].time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors">
                      {isExpanded ? <ChevronUp size={20} className="text-zinc-400" /> : <ChevronDown size={20} className="text-zinc-400" />}
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t dark:border-white/5 bg-zinc-50/50 dark:bg-black/20"
                    >
                      <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between mb-4">
                           <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Activity Timeline</span>
                           <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Time-stamp</span>
                        </div>
                        <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-zinc-100 dark:before:bg-white/5">
                          {session.activity_stream.map((log: any, lIdx: number) => (
                            <div key={log.id} className="flex items-start justify-between relative z-10 pl-8">
                              <div className="absolute left-0 top-1.5 w-[24px] h-[24px] rounded-full bg-white dark:bg-zinc-900 border-2 border-zinc-100 dark:border-white/10 flex items-center justify-center">
                                <div className="w-2 h-2 rounded-full bg-apple-blue" />
                              </div>
                              <div>
                                <p className="text-[14px] font-bold dark:text-white leading-none mb-1">
                                  {log.type.replace(/_/g, ' ')}
                                </p>
                                <p className="text-[13px] text-zinc-500 font-medium">
                                  {log.description}
                                </p>
                                {log.metadata?.session_id && (
                                  <p className="text-[10px] font-mono text-zinc-400 mt-2">ID: {log.metadata.session_id}</p>
                                )}
                              </div>
                              <span className="text-[11px] font-mono text-zinc-400">
                                {new Date(log.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
