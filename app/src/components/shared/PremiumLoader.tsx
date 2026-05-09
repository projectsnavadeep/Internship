import React from 'react';
import { motion } from 'framer-motion';

/**
 * HIGH-FIDELITY SPINNER
 * As requested: A precise, bar-based loading indicator with staggered animations.
 */
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
 * PremiumLoader — Clean, atmospheric loader using the custom Spinner
 */
export const PremiumLoader: React.FC<PremiumLoaderProps> = ({ 
  message = 'Thinking...', 
  size = 'md' 
}) => {
  const spinnerSize = { sm: 20, md: 32, lg: 48 }[size];

  return (
    <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center gap-12">
      <div className="relative flex items-center justify-center">
         {/* Subtle background glow */}
         <div 
           className="absolute inset-0 rounded-full bg-[#0071E3]/5 blur-3xl" 
           style={{ width: spinnerSize * 4, height: spinnerSize * 4 }} 
         />
         <Spinner size={spinnerSize} color="currentColor" className="text-zinc-900 dark:text-white" />
      </div>

      {/* Message with intelligent shimmer */}
      {message && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative text-center"
        >
          <p className="text-zinc-900 dark:text-white text-[15px] font-bold tracking-tight opacity-80">
            {message}
          </p>
          <motion.div 
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 h-[2px] bg-gradient-to-r from-transparent via-[#0071E3] to-transparent"
            animate={{
              width: ["0%", "100%", "0%"],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      )}
    </div>
  );
};

export const InlineLoader: React.FC<{ size?: number; color?: string }> = ({ size = 16, color }) => (
  <div className="inline-flex items-center justify-center">
    <Spinner size={size} color={color || 'currentColor'} />
  </div>
);

export const FullScreenLoader: React.FC<{ message?: string }> = ({ message = 'Initializing InternTrack' }) => (
  <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white dark:bg-zinc-950 overflow-hidden">
    {/* Background Atmosphere */}
    <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-[0.03] pointer-events-none" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#0071E3]/[0.02] blur-[120px] rounded-full pointer-events-none" />
    
    <PremiumLoader size="lg" message={message} />
  </div>
);
