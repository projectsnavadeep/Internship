import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Search, 
  Calendar, 
  User, 
  Terminal, 
  Clock, 
  ChevronRight, 
  Radio
} from 'lucide-react';
import { adminGetDailySessions } from '@/lib/supabase';
import { PremiumLoader } from '@/components/shared/PremiumLoader';

interface SessionActivity {
  id: string;
  time: string;
  type: string;
  description: string;
  metadata: any;
}

interface DailySession {
  user_id: string;
  user_name: string;
  user_role: string;
  session_date: string;
  session_id: string;
  total_actions: number;
  activity_stream: SessionActivity[];
}

export default function SessionControlView() {
  const [sessions, setSessions] = useState<DailySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const data = await adminGetDailySessions();
      setSessions(data);
    } catch (err) {
      console.error('Failed to load sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter(s => 
    s.user_name.toLowerCase().includes(filter.toLowerCase()) ||
    s.session_id.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <PremiumLoader message="Syncing session telemetry..." size="sm" />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-end justify-between"
      >
        <div>
          <h1 className="text-[64px] md:text-[80px] font-semibold tracking-tighter leading-none text-zinc-900 dark:text-white mb-4">
            Sessions.
          </h1>
          <p className="text-[20px] text-zinc-500 dark:text-white/40 tracking-tight font-medium">
            Live engagement telemetry and interaction stream.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full bg-apple-blue/5 border border-apple-blue/10 text-apple-blue font-bold text-xs uppercase tracking-widest">
           <Radio size={14} className="animate-pulse" /> Live Audit Active
        </div>
      </motion.div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-apple-near-black/30" size={18} />
          <input 
            type="text"
            placeholder="Search session ID or user..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full pl-12 pr-6 py-4 rounded-[20px] bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 shadow-sm focus:ring-2 focus:ring-apple-blue/10 outline-none transition-all font-medium text-[15px] dark:text-white"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="px-5 py-3 rounded-2xl bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 flex items-center gap-3">
             <Activity size={18} className="text-apple-blue" />
             <span className="text-sm font-bold dark:text-white">
               {loading ? "Syncing..." : `${sessions.length} Sessions Observed`}
             </span>
          </div>
        </div>
      </div>

      {/* Session Stream */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <PremiumLoader message="Syncing session telemetry..." size="sm" />
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredSessions.length > 0 ? (
              filteredSessions.map((session, idx) => (
                <motion.div
                  key={`${session.user_id}-${session.session_id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`apple-card overflow-hidden transition-all border ${
                    expandedSessionId === session.session_id ? 'ring-2 ring-apple-blue/20 border-apple-blue/20' : 'border-black/5 dark:border-white/5'
                  }`}
                >
                  <div 
                    className="p-6 md:p-8 cursor-pointer hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors"
                    onClick={() => setExpandedSessionId(expandedSessionId === session.session_id ? null : session.session_id)}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center text-apple-near-black dark:text-white shadow-inner">
                           <User size={28} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                            {session.user_name}
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-black/5 dark:bg-white/10 opacity-50">{session.user_role}</span>
                          </h3>
                          <div className="flex items-center gap-3 mt-1 text-apple-near-black/40 font-medium text-sm">
                            <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(session.session_date).toLocaleDateString()}</span>
                            <span className="w-1 h-1 rounded-full bg-black/10" />
                            <span className="flex items-center gap-1.5 font-mono text-apple-blue uppercase">{session.session_id}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-2xl font-black text-apple-near-black dark:text-white">{session.total_actions}</p>
                          <p className="text-[10px] font-black text-apple-near-black/30 uppercase tracking-[0.2em]">Actions</p>
                        </div>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300 ${expandedSessionId === session.session_id ? 'rotate-90 bg-apple-blue text-white shadow-lg shadow-apple-blue/20' : 'bg-black/5 text-apple-near-black/30'}`}>
                           <ChevronRight size={20} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedSessionId === session.session_id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01]"
                      >
                        <div className="p-8 space-y-6">
                          <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-apple-near-black/30 flex items-center gap-2">
                             <Terminal size={14} /> Interaction Stream
                          </h4>
                          <div className="relative pl-8 space-y-8 border-l border-black/5 dark:border-white/10 ml-2">
                            {session.activity_stream.map((action) => (
                              <div key={action.id} className="relative">
                                <div className="absolute -left-[41px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 bg-apple-blue z-10" />
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                   <div>
                                      <div className="flex items-center gap-3">
                                         <span className="text-[15px] font-bold dark:text-white">{action.type}</span>
                                         <span className="text-[11px] font-medium text-apple-near-black/40 flex items-center gap-1">
                                            <Clock size={12} /> {new Date(action.time).toLocaleTimeString()}
                                         </span>
                                      </div>
                                      <p className="text-sm text-apple-near-black/60 dark:text-white/60 mt-1">{action.description}</p>
                                      {action.metadata && Object.keys(action.metadata).length > 0 && (
                                         <div className="mt-3 p-3 rounded-xl bg-white dark:bg-zinc-800 border border-black/5 font-mono text-[11px] text-apple-near-black/40 overflow-x-auto max-w-full">
                                            <pre>{JSON.stringify(action.metadata, null, 2)}</pre>
                                         </div>
                                      )}
                                   </div>
                                   <div className="flex items-center gap-2 shrink-0">
                                      <span className="text-[10px] font-black uppercase tracking-widest text-apple-near-black/20 font-mono">{action.id.split('-')[0]}</span>
                                   </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-32 apple-card border border-dashed border-black/10">
                 <Activity className="mx-auto text-apple-near-black/20 mb-4" size={48} />
                 <p className="text-apple-near-black/40 font-medium">No session data found for this period.</p>
              </div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
