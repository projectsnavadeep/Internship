import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bug, Send, ShieldAlert, Monitor, Info } from 'lucide-react';
import { logError } from '@/lib/supabase';
import { toast } from 'sonner';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  userEmail?: string;
  userName?: string;
}

export default function BugReportModal({ isOpen, onClose, userId, userEmail, userName }: BugReportModalProps) {
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    
    // Gather system telemetry immediately
    const telemetry = {
      userAgent: navigator.userAgent,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };

    // Trigger transmission in the background (Non-blocking Elite Flow)
    logError({
      errorType: 'user_report',
      errorMessage: 'USER COMPLAINT: ' + description.substring(0, 100) + (description.length > 100 ? '...' : ''),
      errorStack: `USER DESCRIPTION:\n${description}\n\nSYSTEM TELEMETRY:\n${JSON.stringify(telemetry, null, 2)}`,
      actionAttempted: 'manual_bug_report',
      userId,
      userEmail,
      userName,
      source: 'frontend',
      role: 'student'
    }).catch(e => console.warn('Background bug report sync failed:', e));

    // Provide instant feedback and close
    toast.success('Report Transmitted. Security team notified.');
    
    setDescription('');
    setIsSubmitting(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-[500px] bg-white dark:bg-zinc-900 rounded-[32px] overflow-hidden shadow-2xl relative z-10 border border-black/5 dark:border-white/10"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/10">
                    <Bug size={24} />
                  </div>
                  <div>
                    <h3 className="text-[20px] font-bold text-zinc-900 dark:text-white leading-tight">Report a Bug</h3>
                    <p className="text-[12px] font-bold text-red-500/60 uppercase tracking-widest">Security & Compliance</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors">
                  <X size={20} className="text-zinc-400" />
                </button>
              </div>

              <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 mb-8 flex gap-4">
                <ShieldAlert size={20} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-[13px] text-red-700/80 dark:text-red-400/80 font-medium leading-relaxed">
                  As a security measure, this report will automatically include system telemetry to help the engineering team diagnose the issue rapidly.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[12px] font-bold text-zinc-500 uppercase tracking-widest mb-3 px-1">Describe the Anomaly</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What happened? (e.g. Page froze after clicking Save)"
                    className="w-full h-32 px-5 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border-none focus:ring-2 focus:ring-red-500/20 text-[15px] resize-none placeholder:text-zinc-400 dark:text-white transition-all"
                  />
                </div>

                <div className="flex items-center gap-6 p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-500">
                    <Monitor size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-zinc-700 dark:text-zinc-300">Telemetry Active</p>
                    <p className="text-[11px] text-zinc-500 font-medium">Browser, OS, and URL will be attached</p>
                  </div>
                  <Info size={16} className="text-zinc-400" />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !description.trim()}
                  className="w-full py-5 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-[16px] flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isSubmitting ? 'Transmitting...' : (
                    <>
                      Transmit Report
                      <Send size={18} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
