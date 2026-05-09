import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  LogOut,
  Bug,
} from 'lucide-react';

import { Logo } from './Logo';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  userName?: string;
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
  isAdmin?: boolean;
  avatarUrl?: string;
  onReportBug?: () => void;
  hasSecurityAlert?: boolean;
}

const studentNavItems = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'applications', label: 'Applications' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'documents', label: 'Documents' },
  { id: 'settings', label: 'Settings' },
];

const adminNavItems = [
  { id: 'admin', label: 'Global Analytics' },
  { id: 'users', label: 'User Registry' },
  { id: 'error-logs', label: 'Error Logs' },
  { id: 'security', label: 'Security & Compliance' },
  { id: 'admin-settings', label: 'System Console' },
];


export function Sidebar({ activeTab, onTabChange, onLogout, isAdmin, avatarUrl, onReportBug, hasSecurityAlert }: SidebarProps) {
  const navItems = isAdmin ? adminNavItems : studentNavItems;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAvatarExpanded, setIsAvatarExpanded] = useState(false);

  const homeTab = isAdmin ? 'admin' : 'dashboard';

  return (
    <>
      {/* ── Desktop Premium Top Header ── */}
      <header className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-white dark:bg-apple-black border-b border-black/5 dark:border-white/5 h-[100px] shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
        <div className="h-full max-w-[1400px] mx-auto px-8 flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-12 shrink-0">
            <button
              onClick={() => onTabChange(homeTab)}
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <Logo size="md" />
            </button>
          </div>

          {/* Centered Navigation */}
          <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const isErrorLogs = item.id === 'error-logs';
              const showAlert = isErrorLogs && hasSecurityAlert;

              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`relative px-6 py-2 group flex items-center justify-center transition-all duration-300 h-10 ${
                    showAlert ? 'hover:scale-105' : ''
                  }`}
                >
                  {/* Security Glow Effect */}
                  {showAlert && (
                    <motion.div
                      layoutId="security-glow"
                      className="absolute inset-0 rounded-full bg-red-500/20 blur-md z-[-20]"
                      animate={{ 
                        opacity: [0.3, 0.6, 0.3],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                  )}

                  {/* Magnetic Background Highlight */}
                  <div className={`absolute inset-0 rounded-full transition-all duration-300 -z-10 ${
                    isActive 
                      ? 'bg-transparent' 
                      : 'bg-transparent group-hover:bg-black/5 dark:group-hover:bg-white/5'
                  }`} />
                  
                  <div className="relative flex items-center justify-center">
                    <span
                      className={`text-[15px] font-medium tracking-tight transition-all duration-300 ${
                        isActive
                          ? 'text-zinc-900 dark:text-white'
                          : 'text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-zinc-200'
                      }`}
                    >
                      {item.label}
                    </span>
                    
                    {showAlert && (
                      <div className="absolute -top-1 -right-3 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600 shadow-[0_0_8px_rgba(220,38,38,0.6)]"></span>
                      </div>
                    )}
                  </div>

                  {isActive && (
                    <motion.div
                      layoutId="active-nav-line"
                      className={`absolute -bottom-[16px] left-0 right-0 h-[3px] rounded-full ${
                        showAlert ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-apple-near-black dark:bg-white'
                      }`}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Utilities */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => {});
                } else {
                  document.exitFullscreen().catch(() => {});
                }
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-400 hover:text-apple-near-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              title="Toggle Focus Mode"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            </button>
            
            {!isAdmin && (
              <button
                onClick={onReportBug}
                className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-all"
                title="Report a Bug / Complaint"
              >
                <Bug size={18} />
              </button>
            )}

            {avatarUrl && (
              <div className="relative flex items-center mx-2">
                <motion.div 
                  className="w-9 h-9 rounded-full border border-black/5 dark:border-white/10 p-0.5 overflow-hidden cursor-pointer"
                  onClick={() => setIsAvatarExpanded(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <img 
                    src={avatarUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover rounded-full"
                  />
                </motion.div>

                <AnimatePresence>
                  {isAvatarExpanded && (
                    <>
                      {/* Surroundings / Backdrop */}
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsAvatarExpanded(false)}
                        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md cursor-zoom-out"
                      />
                      
                      {/* Expanded View */}
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.5, x: '-50%', y: '-50%' }}
                        animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
                        exit={{ opacity: 0, scale: 0.5, x: '-50%', y: '-50%' }}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] pointer-events-none"
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      >
                        <div className="w-[80vw] h-[80vw] max-w-[500px] max-h-[500px] rounded-[40px] p-4 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden pointer-events-auto border border-white/10">
                          <img 
                            src={avatarUrl} 
                            alt="Profile Expanded" 
                            className="w-full h-full object-cover rounded-[32px]"
                          />
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}

            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-full text-[14px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all flex items-center gap-2 h-10"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Nav Header ── */}
      <div className="md:hidden fixed top-0 w-full z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-200/50 dark:border-white/5 p-4 flex items-center justify-between shadow-sm">
        <button
          onClick={() => onTabChange(homeTab)}
          className="flex items-center gap-3 hover:opacity-70 transition-opacity"
        >
          <Logo size="sm" showPlatform={false} />
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileMenuOpen(true)}>
            <Menu size={24} className="text-zinc-900 dark:text-white" />
          </button>
        </div>
      </div>

      {/* ── Mobile Full Screen Menu Overlay ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[60] bg-white dark:bg-zinc-950 flex flex-col"
          >
            <div className="p-6 flex items-center justify-between border-b border-black/5 dark:border-white/5">
              <Logo size="md" />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-10 h-10 rounded-full bg-black/5 dark:bg-white/5 flex items-center justify-center hover:scale-95 transition-transform"
              >
                <X size={24} className="text-zinc-900 dark:text-white" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-8 space-y-8">
              {navItems.map((item, index) => {
                const isErrorLogs = item.id === 'error-logs';
                const showAlert = isErrorLogs && hasSecurityAlert;
                const isActive = activeTab === item.id;

                return (
                  <motion.button
                    key={`mobile-${item.id}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 + 0.1 }}
                    onClick={() => {
                      onTabChange(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className="w-full text-left flex items-center justify-between group"
                  >
                    <span className={`text-[32px] font-semibold tracking-tight transition-colors ${
                      isActive
                        ? (isAdmin ? 'text-apple-near-black dark:text-white' : 'text-apple-blue')
                        : 'text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100'
                    }`}>
                      {item.label}
                    </span>
                    
                    {showAlert && (
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.4)]"></span>
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </nav>

            <div className="p-8 border-t border-black/5 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/50">
              <button
                onClick={onLogout}
                className="w-full py-4 rounded-2xl bg-red-500/10 text-red-500 font-bold text-[18px] flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
              >
                <LogOut size={22} />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
