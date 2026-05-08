import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  LogOut,
  ShieldCheck,
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


export function Sidebar({ activeTab, onTabChange, onLogout, isAdmin }: SidebarProps) {
  const navItems = isAdmin ? adminNavItems : studentNavItems;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-10">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className="relative py-2 group flex flex-col items-center"
                >
                  <span
                    className={`text-[15px] font-medium tracking-tight transition-colors duration-300 ${
                      isActive
                        ? 'text-zinc-900 dark:text-white'
                        : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                    }`}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-line"
                      className="absolute -bottom-[32px] w-full h-[2px] bg-apple-near-black dark:bg-white"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Utilities */}
          <div className="flex items-center gap-6 shrink-0">
            <button
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => {});
                } else {
                  document.exitFullscreen().catch(() => {});
                }
              }}
              className="w-12 h-12 rounded-full flex items-center justify-center text-zinc-400 hover:text-apple-near-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              title="Toggle Focus Mode"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            </button>

            <button
              onClick={onLogout}
              className="px-5 py-2.5 rounded-full text-[14px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all flex items-center gap-2"
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
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[60] bg-white dark:bg-zinc-950 flex flex-col p-6"
          >
            <div className="mb-12 px-1">
              <Logo size="md" />
            </div>
            <div className="flex items-center justify-between mb-12">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-full bg-black/5 dark:bg-white/5"
              >
                <X size={24} className="text-zinc-900 dark:text-white" />
              </button>
            </div>

            <nav className="flex flex-col gap-6">
              {navItems.map((item) => (
                <button
                  key={`mobile-${item.id}`}
                  onClick={() => {
                    onTabChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`text-left text-[24px] font-medium tracking-tight transition-colors ${
                    activeTab === item.id
                      ? isAdmin
                        ? 'text-red-500'
                        : 'text-apple-blue'
                      : 'text-zinc-900 dark:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <div className="h-px bg-black/10 dark:bg-white/10 my-4" />
              <button
                onClick={onLogout}
                className="text-left text-[18px] font-medium text-red-500 flex items-center gap-2"
              >
                <LogOut size={20} /> Sign Out
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
