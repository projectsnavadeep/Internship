import React from 'react';
import { motion } from 'framer-motion';

// ============================================
// PREMIUM LOADING SYSTEM (CONSTELLATION)
// Inspired by neural networks and connecting intelligence.
// ============================================

interface PremiumLoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * ConstellationNode — A single pulsing node in the network
 */
const ConstellationNode: React.FC<{ delay: number; customX: number[]; customY: number[]; size: number }> = ({ 
  delay, customX, customY, size 
}) => (
  <motion.div
    className="absolute rounded-full bg-apple-blue shadow-[0_0_15px_rgba(0,122,255,0.5)]"
    style={{ width: size, height: size }}
    animate={{
      x: customX,
      y: customY,
      scale: [1, 1.2, 0.9, 1],
      opacity: [0.6, 1, 0.5, 0.6],
    }}
    transition={{
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
      delay,
    }}
  />
);

/**
 * PremiumLoader — Full-page / section-level loader
 */
export const PremiumLoader: React.FC<PremiumLoaderProps> = ({ 
  message = 'Processing...', 
  size = 'md' 
}) => {
  const nodeSize = { sm: 4, md: 6, lg: 8 }[size];
  const areaSize = { sm: 60, md: 80, lg: 100 }[size];

  return (
    <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center gap-8">
      <div className="relative" style={{ width: areaSize, height: areaSize }}>
        {/* Connection Lines (SVG) */}
        <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none opacity-20">
          <motion.circle
            cx="50%" cy="50%" r="35%"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-apple-blue"
            animate={{ strokeDasharray: ["1, 5", "5, 1"], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </svg>

        {/* Nodes */}
        <ConstellationNode size={nodeSize} delay={0} customX={[-20, 20, 0, -20]} customY={[0, -20, 20, 0]} />
        <ConstellationNode size={nodeSize} delay={0.5} customX={[20, -20, 10, 20]} customY={[10, 20, -10, 10]} />
        <ConstellationNode size={nodeSize} delay={1} customX={[0, 15, -15, 0]} customY={[-25, 5, 15, -25]} />
        <ConstellationNode size={nodeSize} delay={1.5} customX={[-15, 0, 20, -15]} customY={[15, -20, 5, 15]} />
      </div>

      {/* Message */}
      {message && (
        <motion.div className="text-center">
          <motion.p
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-apple-near-black/50 dark:text-white/50 text-xs font-black uppercase tracking-[0.3em]"
          >
            {message}
          </motion.p>
        </motion.div>
      )}
    </div>
  );
};

export const InlineLoader: React.FC<{ size?: number; color?: string }> = ({ size = 16, color }) => (
  <div className="inline-flex items-center gap-1">
    {[0, 1, 2].map((i) => (
      <motion.span
        key={i}
        className={`rounded-full ${color || 'bg-current'}`}
        style={{ width: size / 4, height: size / 4 }}
        animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
      />
    ))}
  </div>
);

export const FullScreenLoader: React.FC<{ message?: string }> = ({ message = 'Initializing System' }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950">
    <PremiumLoader size="lg" message={message} />
  </div>
);
