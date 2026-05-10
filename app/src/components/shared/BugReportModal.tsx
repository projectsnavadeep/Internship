import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Globe, Monitor, Bug, Loader2 } from 'lucide-react';
import { logError, uploadBugScreenshot } from '@/lib/supabase';
import { toast } from 'sonner';

interface BugReportModalProps {
  onClose: () => void;
  userId?: string;
  userEmail?: string;
  userName?: string;
}

const ERROR_TYPES = [
  'UI Glitch',
  'Functionality Issue',
  'Network Error',
  'Data Sync',
  'Other'
];

export function BugReportModal({ onClose, userId, userEmail, userName }: BugReportModalProps) {
  const [description, setDescription] = useState('');
  const [errorType, setErrorType] = useState('UI Glitch');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Auto-detected metadata
  const [metadata, setMetadata] = useState({
    page: '',
    os: '',
    browser: '',
    isOnline: true
  });

  useEffect(() => {
    // Detect OS
    let os = 'Unknown OS';
    if (navigator.userAgent.indexOf('Win') !== -1) os = 'Windows';
    if (navigator.userAgent.indexOf('Mac') !== -1) os = 'MacOS';
    if (navigator.userAgent.indexOf('X11') !== -1) os = 'UNIX';
    if (navigator.userAgent.indexOf('Linux') !== -1) os = 'Linux';

    // Detect Browser
    let browser = 'Unknown Browser';
    if (navigator.userAgent.indexOf('Chrome') !== -1) browser = 'Chrome';
    else if (navigator.userAgent.indexOf('Safari') !== -1) browser = 'Safari';
    else if (navigator.userAgent.indexOf('Firefox') !== -1) browser = 'Firefox';
    else if (navigator.userAgent.indexOf('Edge') !== -1) browser = 'Edge';

    setMetadata({
      page: window.location.hash || window.location.pathname,
      os,
      browser,
      isOnline: navigator.onLine
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error('Please describe the bug');
      return;
    }

    setIsSubmitting(true);
    try {
      const fullMessage = [
        `[${errorType}] ${description}`,
        `OS: ${metadata.os} | Browser: ${metadata.browser}`,
        `Page: ${metadata.page} | Connection: ${metadata.isOnline ? 'Online' : 'Offline'}`,
        file ? `Screenshot attached: ${file.name}` : null,
      ].filter(Boolean).join('\n');

      // Map human-readable category to valid ErrorType
      const typeMap: Record<string, any> = {
        'UI Glitch': 'rendering',
        'Functionality Issue': 'unknown',
        'Network Error': 'network',
        'Data Sync': 'data_load',
        'Other': 'user_bug_report',
      };
      const mappedErrorType = typeMap[errorType] ?? 'user_bug_report';

      // Upload screenshot if attached (non-blocking — report still submits if upload fails)
      let screenshotUrl: string | null = null;
      if (file && userId) {
        screenshotUrl = await uploadBugScreenshot(userId, file);
      }

      await logError({
        userId,
        userEmail,
        userName,
        role: 'student',
        errorType: mappedErrorType,
        errorMessage: fullMessage,
        source: 'user_bug_report',
        endpointOrFile: metadata.page,
        actionAttempted: `Bug Report: ${errorType}`,
        screenshotUrl: screenshotUrl || undefined,
      });

      toast.success('Bug report submitted. Our team will investigate.');
      onClose();
    } catch (err) {
      console.error('[BugReport] Submit failed:', err);
      toast.error('Failed to submit bug report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative z-10 w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[32px] p-6 shadow-2xl border border-black/5 dark:border-white/5"
      >
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
            <Bug size={24} />
          </div>
          <div>
            <h2 className="text-[22px] font-semibold tracking-tight text-zinc-900 dark:text-white">Report an Issue</h2>
            <p className="text-[13px] text-zinc-500 dark:text-zinc-400">Help us improve the platform.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">Issue Type</label>
            <select
              value={errorType}
              onChange={(e) => setErrorType(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-[15px] text-zinc-900 dark:text-white focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue transition-all outline-none"
            >
              {ERROR_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What happened? What were you trying to do?"
              className="w-full h-24 resize-none bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 text-[15px] text-zinc-900 dark:text-white focus:ring-2 focus:ring-apple-blue/20 focus:border-apple-blue transition-all outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">Attach Screenshot (Optional)</label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="w-full border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-xl px-4 py-4 flex items-center justify-center gap-3 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                <Upload size={20} />
                <span className="text-[14px] font-medium">
                  {file ? file.name : 'Click or drag image to upload'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-xl p-4 flex flex-wrap gap-4 text-[12px] text-zinc-500 font-medium">
            <div className="flex items-center gap-1.5"><Monitor size={14} /> {metadata.os} • {metadata.browser}</div>
            <div className="flex items-center gap-1.5"><Globe size={14} /> {metadata.page}</div>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${metadata.isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              {metadata.isOnline ? 'Online' : 'Offline'}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl py-3.5 font-bold text-[15px] hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Report'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
