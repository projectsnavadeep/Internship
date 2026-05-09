import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { updateSessionTime } from '@/lib/supabase';

interface DashboardSessionTimerProps {
  userId?: string;
  initialToday: number;
  initialTotal: number;
}

export function DashboardSessionTimer({ userId, initialToday, initialTotal }: DashboardSessionTimerProps) {
  const [todayMins, setTodayMins] = useState(initialToday);
  const [totalMins, setTotalMins] = useState(initialTotal);

  // Sync with initial props if they change (e.g. on page refresh/sync)
  useEffect(() => {
    setTodayMins(initialToday);
    setTotalMins(initialTotal);
  }, [initialToday, initialTotal]);

  useEffect(() => {
    if (!userId) return;

    // Background sync to DB every minute
    const syncInterval = setInterval(async () => {
      setTodayMins(prev => prev + 1);
      setTotalMins(prev => prev + 1);
      
      // Persist to Supabase in background
      updateSessionTime(userId, 1).catch(() => {});
    }, 60000);

    return () => clearInterval(syncInterval);
  }, [userId]);

  return (
    <div className="flex items-center gap-3 bg-apple-blue/[0.03] border border-apple-blue/10 px-5 py-2.5 rounded-2xl w-fit">
      <Clock size={18} className="text-apple-blue animate-pulse" />
      <div className="flex flex-col">
        <span className="text-[10px] font-bold text-apple-blue uppercase tracking-widest leading-none mb-1">Session Duration</span>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-apple-blue uppercase tracking-widest leading-none">Today</span>
            <span className="text-[15px] font-bold text-zinc-900 dark:text-white tabular-nums">
              {todayMins}m Spent
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-zinc-400 uppercase tracking-widest leading-none">2026 Total</span>
            <span className="text-[13px] font-medium text-zinc-500 tabular-nums">
              {totalMins}m Tracked
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
