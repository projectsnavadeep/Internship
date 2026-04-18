import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: string;
  delay?: number;
}

export function StatsCard({ title, value, icon, trend, trendValue, color, delay = 0 }: StatsCardProps) {
  const trendIcon = trend === 'up' ? <TrendingUp size={14} /> : 
                    trend === 'down' ? <TrendingDown size={14} /> : 
                    <Minus size={14} />;
  
  const trendColor = trend === 'up' ? 'text-apple-blue' : 
                     trend === 'down' ? 'text-red-500' : 
                     'text-apple-near-black/40 dark:text-white/40';

  return (
    <motion.div
      className="apple-card apple-card-lift p-6 bg-white dark:bg-apple-near-black"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="flex items-center justify-between mb-6">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center bg-apple-gray dark:bg-zinc-800"
          style={{ color: color === '#1d1d1f' ? undefined : color }}
        >
          {icon}
        </div>
        
        {trend && trendValue && (
          <div className={`flex items-center gap-1.5 text-[13px] font-semibold tracking-apple-tight ${trendColor}`}>
            {trendIcon}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <motion.h3
          className="text-[34px] font-bold tracking-apple-tight text-apple-near-black dark:text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.2, duration: 0.5 }}
        >
          {value}
        </motion.h3>
        <p className="text-[14px] font-medium text-apple-near-black/40 dark:text-white/40 tracking-apple-body uppercase">
          {title}
        </p>
      </div>
    </motion.div>
  );
}
