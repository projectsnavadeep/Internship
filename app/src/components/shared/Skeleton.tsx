import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'rect' | 'circle' | 'text';
  style?: React.CSSProperties;
}

export function Skeleton({ className, variant = 'rect', style }: SkeletonProps) {
  return (
    <motion.div
      style={style}
      initial={{ opacity: 0.3 }}
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ 
        duration: 2, 
        repeat: Infinity, 
        ease: "easeInOut" 
      }}
      className={cn(
        "bg-zinc-200 dark:bg-zinc-800",
        variant === 'circle' ? "rounded-full" : 
        variant === 'text' ? "rounded-md h-3 w-full" : "rounded-2xl",
        className
      )}
    />
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
