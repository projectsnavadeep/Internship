import React from 'react';
import { motion } from 'framer-motion';

interface LoadingViewProps {
  message?: string;
}

export const LoadingView: React.FC<LoadingViewProps> = ({ message = 'Loading View' }) => {
  return (
    <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center gap-4">
      <motion.div
        className="w-12 h-12 rounded-full border-[3px] border-apple-blue/20 border-t-apple-blue"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-apple-near-black/40 dark:text-white/40 text-sm font-medium tracking-apple-tight"
      >
        {message}
      </motion.p>
    </div>
  );
};
