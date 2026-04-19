import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Trash2, Loader2, RefreshCw,
  Clock, User, Bug, FileWarning, Shield, ChevronUp, ChevronDown, MessageSquare
} from 'lucide-react';
import { adminGetErrorLogs, adminResolveError, adminDeleteErrorLog } from '@/lib/supabase';
import { toast } from 'sonner';

interface ErrorLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  error_type: string;
  error_message: string;
  error_details: string | null;
  action_attempted: string;
  resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
}

const ERROR_TYPE_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  auth: { label: 'Authentication', color: 'text-red-500 bg-red-500/10', icon: Shield },
  application_save: { label: 'App Save', color: 'text-orange-500 bg-orange-500/10', icon: FileWarning },
  application_update: { label: 'App Update', color: 'text-amber-500 bg-amber-500/10', icon: FileWarning },
  application_delete: { label: 'App Delete', color: 'text-rose-500 bg-rose-500/10', icon: Trash2 },
  resume_upload: { label: 'Resume Upload', color: 'text-blue-500 bg-blue-500/10', icon: FileWarning },
  cover_letter_upload: { label: 'Cover Letter', color: 'text-indigo-500 bg-indigo-500/10', icon: FileWarning },
  document_upload: { label: 'Doc Upload', color: 'text-cyan-500 bg-cyan-500/10', icon: FileWarning },
  document_delete: { label: 'Doc Delete', color: 'text-pink-500 bg-pink-500/10', icon: Trash2 },
  profile_update: { label: 'Profile', color: 'text-purple-500 bg-purple-500/10', icon: User },
  password_change: { label: 'Password', color: 'text-red-600 bg-red-600/10', icon: Shield },
  avatar_upload: { label: 'Avatar', color: 'text-teal-500 bg-teal-500/10', icon: User },
  data_load: { label: 'Data Load', color: 'text-gray-500 bg-gray-500/10', icon: Bug },
  unknown: { label: 'Unknown', color: 'text-zinc-400 bg-zinc-400/10', icon: Bug },
};

export function ErrorLogsView({ adminId }: { adminId?: string }) {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');

  useEffect(() => { loadLogs(); }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await adminGetErrorLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load error logs:', err);
      toast.error('Failed to load error logs');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (logId: string) => {
    if (!adminId) return;
    try {
      await adminResolveError(logId, adminId, resolveNotes || 'Resolved by admin');
      setLogs(prev => prev.map(l => l.id === logId ? { ...l, resolved: true, resolved_at: new Date().toISOString(), resolution_notes: resolveNotes } : l));
      setResolvingId(null);
      setResolveNotes('');
      toast.success('Error resolved successfully');
    } catch (err) {
      toast.error('Failed to resolve error');
    }
  };

  const handleDelete = async (logId: string) => {
    try {
      await adminDeleteErrorLog(logId);
      setLogs(prev => prev.filter(l => l.id !== logId));
      toast.success('Error log deleted');
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const filtered = logs.filter(l => {
    if (filter === 'unresolved') return !l.resolved;
    if (filter === 'resolved') return l.resolved;
    return true;
  });

  const unresolvedCount = logs.filter(l => !l.resolved).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 size={40} className="animate-spin text-red-500" />
        <p className="text-apple-near-black/40 dark:text-white/40">Loading error logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="display-hero text-apple-near-black dark:text-white">Error Logs.</h1>
        <p className="text-[18px] text-apple-near-black/60 dark:text-white/60 mt-1">
          Monitor and resolve user errors in real-time.
        </p>
      </motion.div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="apple-card p-5 bg-white dark:bg-zinc-900 border border-black/5 dark:border-white/5 text-center">
          <p className="text-3xl font-bold text-apple-near-black dark:text-white">{logs.length}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-apple-near-black/30 mt-1">Total</p>
        </div>
        <div className="apple-card p-5 bg-white dark:bg-zinc-900 border border-red-500/20 text-center">
          <p className="text-3xl font-bold text-red-500">{unresolvedCount}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-red-500/60 mt-1">Unresolved</p>
        </div>
        <div className="apple-card p-5 bg-white dark:bg-zinc-900 border border-emerald-500/20 text-center">
          <p className="text-3xl font-bold text-emerald-500">{logs.length - unresolvedCount}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-500/60 mt-1">Resolved</p>
        </div>
      </div>

      {/* Filter + Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(['all', 'unresolved', 'resolved'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-[13px] font-bold uppercase tracking-wider transition-all ${
                filter === f
                  ? 'bg-apple-blue text-white shadow-lg shadow-apple-blue/20'
                  : 'bg-black/5 dark:bg-white/5 text-apple-near-black/50 dark:text-white/50 hover:bg-black/10'
              }`}
            >
              {f === 'unresolved' ? `${f} (${unresolvedCount})` : f}
            </button>
          ))}
        </div>
        <button onClick={loadLogs} className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-apple-blue/10 transition-all">
          <RefreshCw size={18} className="text-apple-blue" />
        </button>
      </div>

      {/* Error List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <CheckCircle2 size={48} className="mx-auto text-emerald-400 mb-4" />
          <p className="text-lg font-bold text-apple-near-black/40 dark:text-white/40">
            {filter === 'unresolved' ? 'No unresolved errors!' : 'No error logs found.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map((log, i) => {
              const typeInfo = ERROR_TYPE_LABELS[log.error_type] || ERROR_TYPE_LABELS.unknown;
              const TypeIcon = typeInfo.icon;
              const isExpanded = expandedId === log.id;
              const isResolving = resolvingId === log.id;

              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: i * 0.03 }}
                  className={`apple-card bg-white dark:bg-zinc-900 border overflow-hidden ${
                    log.resolved ? 'border-emerald-500/10' : 'border-red-500/10'
                  }`}
                >
                  {/* Main Row */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-black/2 dark:hover:bg-white/2 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${typeInfo.color}`}>
                        <TypeIcon size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-[14px] dark:text-white truncate">{log.error_message}</h4>
                          {log.resolved && <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[12px] text-apple-near-black/40 dark:text-white/40">
                          <span className="flex items-center gap-1">
                            <User size={11} />
                            {log.user_name || log.user_email || 'Unknown User'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {new Date(log.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {!log.resolved && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setResolvingId(isResolving ? null : log.id); }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-[12px] font-bold hover:bg-emerald-500/20 transition-all"
                        >
                          Resolve
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(log.id); }}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                      {isExpanded ? <ChevronUp size={16} className="text-apple-near-black/30" /> : <ChevronDown size={16} className="text-apple-near-black/30" />}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-black/5 dark:border-white/5"
                      >
                        <div className="p-5 space-y-3 text-[13px]">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="font-bold text-apple-near-black/30 dark:text-white/30 uppercase text-[11px] tracking-wider">Action Attempted</p>
                              <p className="mt-1 dark:text-white">{log.action_attempted}</p>
                            </div>
                            <div>
                              <p className="font-bold text-apple-near-black/30 dark:text-white/30 uppercase text-[11px] tracking-wider">User ID</p>
                              <p className="mt-1 dark:text-white font-mono text-[11px]">{log.user_id || 'N/A'}</p>
                            </div>
                          </div>
                          {log.error_details && (
                            <div>
                              <p className="font-bold text-apple-near-black/30 dark:text-white/30 uppercase text-[11px] tracking-wider">Technical Details</p>
                              <pre className="mt-1 p-3 rounded-xl bg-black/5 dark:bg-white/5 text-[11px] font-mono overflow-auto max-h-32 dark:text-white/70">{log.error_details}</pre>
                            </div>
                          )}
                          {log.resolved && log.resolution_notes && (
                            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                              <p className="font-bold text-emerald-600 text-[11px] uppercase tracking-wider">Resolution</p>
                              <p className="mt-1 text-emerald-700 dark:text-emerald-400">{log.resolution_notes}</p>
                              <p className="mt-1 text-[11px] text-emerald-500/60">{log.resolved_at ? new Date(log.resolved_at).toLocaleString() : ''}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Resolve Input */}
                  <AnimatePresence>
                    {isResolving && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-emerald-500/10 bg-emerald-500/5 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <MessageSquare size={16} className="text-emerald-500 shrink-0" />
                          <input
                            type="text"
                            value={resolveNotes}
                            onChange={(e) => setResolveNotes(e.target.value)}
                            placeholder="Add resolution notes (optional)..."
                            className="flex-1 px-4 py-2 rounded-xl bg-white dark:bg-zinc-800 text-[13px] border-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                          <button
                            onClick={() => handleResolve(log.id)}
                            className="px-4 py-2 rounded-xl bg-emerald-500 text-white text-[13px] font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                          >
                            Confirm
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
