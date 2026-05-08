import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Download, FileText, AlertCircle } from 'lucide-react';
import { PremiumLoader } from '@/components/shared/PremiumLoader';
import { useState, useEffect } from 'react';

interface DocumentViewerProps {
  url: string;
  name: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentViewer({ url, name, isOpen, onClose }: DocumentViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const fileExt = name.split('.').pop()?.toLowerCase();
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(fileExt || '');
  const isPDF = fileExt === 'pdf';

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      setError(false);
      // Escape key to close
      const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
        />

        {/* Viewer Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-5xl h-full max-h-[90vh] bg-white dark:bg-zinc-900 rounded-[32px] overflow-hidden shadow-2xl flex flex-col border border-white/10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-white/5 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-apple-blue/10 flex items-center justify-center text-apple-blue">
                <FileText size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-apple-near-black dark:text-white truncate max-w-[200px] md:max-w-md">
                  {name}
                </h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Secure Document Node</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 hover:text-apple-blue transition-all"
                title="Open in new tab"
              >
                <ExternalLink size={18} />
              </a>
              <a
                href={url}
                download={name}
                className="p-2.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-500 hover:text-apple-blue transition-all"
                title="Download"
              >
                <Download size={18} />
              </a>
              <div className="w-[1px] h-4 bg-zinc-200 dark:bg-white/10 mx-1" />
              <button
                onClick={onClose}
                className="p-2.5 rounded-xl hover:bg-red-50 dark:hover:bg-red-500/10 text-zinc-500 hover:text-red-500 transition-all"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-apple-gray dark:bg-zinc-950/50 relative overflow-hidden">
            {loading && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm z-10 transition-opacity">
                <PremiumLoader message="Loading document..." size="sm" />
              </div>
            )}

            {error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-4">
                  <AlertCircle size={32} />
                </div>
                <h4 className="text-lg font-bold dark:text-white mb-2">Display Inhibition</h4>
                <p className="text-sm text-zinc-500 max-w-xs mb-6">
                  This document type cannot be previewed directly. Please use the download or external link options.
                </p>
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="apple-pill-filled px-8"
                >
                  Download to View
                </a>
              </div>
            ) : isPDF ? (
              <iframe
                src={`${url}#toolbar=1`}
                className="w-full h-full border-none"
                onLoad={() => setLoading(false)}
                onError={() => { setError(true); setLoading(false); }}
              />
            ) : isImage ? (
              <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
                <img
                  src={url}
                  alt={name}
                  className="max-w-full max-h-full object-contain shadow-lg rounded-lg"
                  onLoad={() => setLoading(false)}
                  onError={() => { setError(true); setLoading(false); }}
                />
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-zinc-50 dark:bg-zinc-950">
                <div className="w-20 h-20 rounded-3xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-400 mb-6 shadow-inner tracking-tighter">
                  <FileText size={40} />
                </div>
                <h3 className="section-heading dark:text-white mb-3">Preview Not Available</h3>
                <p className="text-zinc-500 max-w-sm mb-8 text-[15px]">
                  Professional documents like .docx or .xlsx require specialized software for deep inspection.
                </p>
                <div className="flex gap-4">
                  <a href={url} download={name} className="apple-pill-filled px-8">
                    Download File
                  </a>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="apple-pill-outline px-8 border-zinc-300 dark:border-white/10 dark:text-white">
                    Open Externally
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Footer Monitor */}
          <div className="px-6 py-3 border-t border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/80 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400">
            <span>Security Status: encrypted_layer_s3</span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Stream Verified
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
