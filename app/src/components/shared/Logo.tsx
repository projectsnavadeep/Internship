import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtext?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = 'md', showSubtext = true }) => {
  const sizeClasses = {
    sm: { main: 'text-lg', sub: 'text-[9px]' },
    md: { main: 'text-2xl', sub: 'text-[11px]' },
    lg: { main: 'text-[42px]', sub: 'text-[14px]' }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={`flex flex-col items-start leading-none ${className}`}>
      {showSubtext && (
        <span className={`font-black uppercase tracking-[0.2em] text-apple-near-black/60 dark:text-white/60 mb-1 ${currentSize.sub}`}>
          INTERNTRACK'S
        </span>
      )}
      <div className={`font-black tracking-tighter ${currentSize.main}`}>
        <span className="text-apple-near-black dark:text-white">Intern</span>
        <span className="text-apple-blue">Track</span>
      </div>
    </div>
  );
};
