import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'rect' | 'circle' | 'text';
  style?: React.CSSProperties;
}

export function Skeleton({ className, variant = 'rect', style }: SkeletonProps) {
  return (
    <div
      style={style}
      className={cn(
        "relative overflow-hidden bg-zinc-200 dark:bg-zinc-800",
        variant === 'circle' ? "rounded-full" : 
        variant === 'text' ? "rounded-md h-3 w-full" : "rounded-2xl",
        className
      )}
    >
      {/* Shimmer Overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent -translate-x-full"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}

export function SkeletonCircle({ size = 40, className }: { size?: number, className?: string }) {
  return <Skeleton variant="circle" className={className} style={{ width: size, height: size }} />;
}

export function SkeletonText({ className }: { className?: string }) {
  return <Skeleton variant="text" className={className} />;
}

export function SkeletonRect({ className }: { className?: string }) {
  return <Skeleton variant="rect" className={className} />;
}
