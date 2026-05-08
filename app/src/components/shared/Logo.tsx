import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showPlatform?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = 'md', showPlatform = true }) => {
  const sizes = {
    sm: { main: 'text-[12px]', sub: 'text-[5px]', platform: 'text-[14px]', gap: 'gap-2', sep: 'h-4' },
    md: { main: 'text-[16px]', sub: 'text-[7px]', platform: 'text-[18px]', gap: 'gap-3', sep: 'h-6' },
    lg: { main: 'text-[28px]', sub: 'text-[10px]', platform: 'text-[32px]', gap: 'gap-6', sep: 'h-10' }
  };

  const s = sizes[size];
  
  return (
    <div className={`flex items-center justify-center ${s.gap} ${className}`}>
      {/* InternTrack Main Logo */}
      <div className="flex flex-col leading-[0.8] text-right shrink-0">
        <span className={`${s.main} font-black tracking-tighter text-zinc-900 dark:text-white uppercase`}>
          Intern
        </span>
        <span className={`${s.main} font-black tracking-tighter text-[#0071E3] uppercase`}>
          Track
        </span>
      </div>

      {showPlatform && (
        <>
          {/* Separator */}
          <div className={`${s.sep} w-[1px] bg-zinc-200 dark:bg-zinc-800 shrink-0`} />

          {/* Platform Label */}
          <div className="flex flex-col leading-[1.0] justify-center shrink-0 text-left">
            <span className={`${s.sub} font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] mb-1`}>
              The Professional
            </span>
            <span className={`${s.platform} font-black tracking-tighter text-zinc-900 dark:text-white`}>
              Platform
            </span>
          </div>
        </>
      )}
    </div>
  );
};
