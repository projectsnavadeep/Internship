import React from 'react';
import { motion } from 'framer-motion';

const bars = [
  { delay: "-1.2s", transform: "rotate(.0001deg) translate(146%)" },
  { delay: "-1.1s", transform: "rotate(30deg) translate(146%)" },
  { delay: "-1.0s", transform: "rotate(60deg) translate(146%)" },
  { delay: "-0.9s", transform: "rotate(90deg) translate(146%)" },
  { delay: "-0.8s", transform: "rotate(120deg) translate(146%)" },
  { delay: "-0.7s", transform: "rotate(150deg) translate(146%)" },
  { delay: "-0.6s", transform: "rotate(180deg) translate(146%)" },
  { delay: "-0.5s", transform: "rotate(210deg) translate(146%)" },
  { delay: "-0.4s", transform: "rotate(240deg) translate(146%)" },
  { delay: "-0.3s", transform: "rotate(270deg) translate(146%)" },
  { delay: "-0.2s", transform: "rotate(300deg) translate(146%)" },
  { delay: "-0.1s", transform: "rotate(330deg) translate(146%)" }
];

export const Spinner = ({ size = 20, color = "#8f8f8f", className = "" }: { size?: number; color?: string; className?: string }) => {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <style>
        {`
          @keyframes spinner-spin {
            0% { opacity: 0.15; }
            100% { opacity: 1; }
          }
        `}
      </style>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: size, height: size }}>
        {bars.map((item) => (
          <div
            key={item.transform}
            className="absolute h-[8%] w-[24%] -left-[12%] -top-[4%] rounded-[5px]"
            style={{
              backgroundColor: color,
              animation: "spinner-spin 1.2s linear infinite",
              animationDelay: item.delay,
              transform: item.transform
            }}
          />
        ))}
      </div>
    </div>
  );
};

interface PremiumLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * PremiumLoader — Used inline inside views.
 * Centers itself within whatever container it's placed in.
 */
export const PremiumLoader: React.FC<PremiumLoaderProps> = ({
  message = 'Loading...',
  size = 'md'
}) => {
  const spinnerSize = { sm: 20, md: 32, lg: 48 }[size];

  return (
    <div className="flex flex-col items-center justify-center gap-8 py-4">
      <div className="relative flex items-center justify-center">
        <div
          className="absolute rounded-full bg-[#0071E3]/5 blur-2xl pointer-events-none"
          style={{ width: spinnerSize * 5, height: spinnerSize * 5 }}
        />
        <Spinner size={spinnerSize} color="currentColor" className="text-zinc-900 dark:text-white relative z-10" />
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="relative text-center"
        >
          <p className="text-zinc-500 dark:text-zinc-400 text-[14px] font-medium tracking-tight">
            {message}
          </p>
          <motion.div
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#0071E3] to-transparent"
            animate={{ width: ["0%", "100%", "0%"], opacity: [0, 1, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      )}
    </div>
  );
};

/**
 * PageLoader — Fills the full content area (not fixed).
 * Use this inside route-level components instead of PremiumLoader
 * for a properly centered mid-page loading state.
 */
export const PageLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  const spinnerSize = 40;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="w-full flex flex-col items-center justify-center gap-10"
      style={{ minHeight: 'calc(100vh - 180px)' }}
    >
      {/* Ambient glow */}
      <div className="relative flex items-center justify-center">
        <motion.div
          className="absolute rounded-full bg-[#0071E3]/8 blur-3xl pointer-events-none"
          style={{ width: spinnerSize * 6, height: spinnerSize * 6 }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <Spinner
          size={spinnerSize}
          color="currentColor"
          className="text-zinc-800 dark:text-white relative z-10"
        />
      </div>

      {/* Message */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col items-center gap-3"
      >
        <p className="text-[16px] font-semibold text-zinc-800 dark:text-white tracking-tight">
          {message}
        </p>
        <motion.div
          className="h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#0071E3] to-transparent"
          animate={{ width: ["0px", "120px", "0px"], opacity: [0, 1, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </motion.div>
  );
};

export const InlineLoader: React.FC<{ size?: number; color?: string }> = ({ size = 16, color }) => (
  <div className="inline-flex items-center justify-center">
    <Spinner size={size} color={color || 'currentColor'} />
  </div>
);

export const FullScreenLoader: React.FC<{ message?: string }> = ({ message = 'Initializing InternTrack' }) => (
  <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white dark:bg-zinc-950 overflow-hidden">
    <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-[0.03] pointer-events-none" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#0071E3]/[0.02] blur-[120px] rounded-full pointer-events-none" />

    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative z-10 flex flex-col items-center gap-10"
    >
      <div className="relative">
        <motion.div
          className="absolute inset-0 rounded-full bg-[#0071E3]/10 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <Spinner size={52} color="currentColor" className="text-zinc-900 dark:text-white relative z-10" />
      </div>

      <div className="flex flex-col items-center gap-3">
        <p className="text-[17px] font-semibold text-zinc-900 dark:text-white tracking-tight">
          {message}
        </p>
        <motion.div
          className="h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#0071E3] to-transparent"
          animate={{ width: ["0px", "140px", "0px"], opacity: [0, 1, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  </div>
);