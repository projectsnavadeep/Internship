import React from 'react';
import { motion } from 'framer-motion';

/**
 * NEURAL FLUID LOADING SYSTEM
 * Inspired by Claude and Grok's minimalist, high-end intelligent aesthetics.
 */

interface PremiumLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * NeuralPulse — A soft, breathing light effect
 */
const NeuralPulse: React.FC<{ size: number }> = ({ size }) => (
  <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
    {/* Outer Glow */}
    <motion.div
      className="absolute inset-0 rounded-full bg-[#0071E3]/20 blur-2xl"
      animate={{
        scale: [1, 1.4, 1],
        opacity: [0.3, 0.6, 0.3],
      }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
    
    {/* Middle Ripple */}
    <motion.div
      className="absolute w-1/2 h-1/2 rounded-full border border-[#0071E3]/30"
      animate={{
        scale: [1, 2, 1],
        opacity: [0.6, 0, 0.6],
      }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
    />

    {/* Core Intelligence */}
    <motion.div
      className="relative w-4 h-4 rounded-full bg-[#0071E3] shadow-[0_0_20px_rgba(0,113,227,0.8)]"
      animate={{
        scale: [1, 1.1, 1],
      }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <div className="absolute inset-0 rounded-full bg-white/40 blur-[2px]" />
    </motion.div>
  </div>
);

/**
 * PremiumLoader — Clean, atmospheric loader
 */
export const PremiumLoader: React.FC<PremiumLoaderProps> = ({ 
  message = 'Thinking...', 
  size = 'md' 
}) => {
  const areaSize = { sm: 40, md: 80, lg: 120 }[size];

  return (
    <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center gap-12">
      <NeuralPulse size={areaSize} />

      {/* Message with intelligent shimmer */}
      {message && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative"
        >
          <p className="text-zinc-900 dark:text-white text-[14px] font-semibold tracking-tight">
            {message}
          </p>
          <motion.div 
            className="absolute -bottom-2 left-0 h-[2px] bg-gradient-to-r from-transparent via-[#0071E3] to-transparent"
            animate={{
              width: ["0%", "100%", "0%"],
              left: ["0%", "0%", "100%"],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      )}
    </div>
  );
};

export const InlineLoader: React.FC<{ size?: number; color?: string }> = ({ size = 16, color }) => (
  <div className="inline-flex items-center gap-1.5 px-2">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className={`rounded-full ${color || 'bg-zinc-900 dark:bg-white'}`}
        style={{ width: size / 4, height: size / 4 }}
        animate={{ 
          y: [0, -4, 0],
          opacity: [0.3, 1, 0.3],
          scale: [1, 1.1, 1]
        }}
        transition={{ 
          duration: 1.2, 
          repeat: Infinity, 
          delay: i * 0.15,
          ease: "easeInOut"
        }}
      />
    ))}
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
