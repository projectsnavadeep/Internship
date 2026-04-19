import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Briefcase, 
  Search,
  Menu,
  X,
  LogOut,
  Bell
} from 'lucide-react';

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

export function Sidebar({ activeTab, onTabChange, onLogout, userName, isAdmin }: SidebarProps) {
  const navItems = isAdmin ? adminNavItems : studentNavItems;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false); // expanded search state

  return (
    <>
      {/* Desktop Floating Nav Pill */}
      <div className="hidden md:flex fixed top-[24px] left-0 right-0 z-50 justify-center pointer-events-none px-6">
        <motion.nav 
          className="mc-nav-pill pointer-events-auto flex items-center justify-between w-full max-w-[1280px]"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center text-white font-bold text-[14px]">
              IT
            </div>
            <span className="text-[17px] font-bold text-zinc-900 tracking-tight">
              InternTrack
            </span>
          </div>

          {/* Center Links */}
          <div className="flex items-center gap-[40px]">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className="relative py-2 group"
                >
                  <span className={`text-[14px] font-semibold transition-colors ${isActive ? 'text-zinc-900' : 'text-zinc-500 hover:text-zinc-900'}`}>
                    {item.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill-active"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-zinc-900 rounded-t-full"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Utilities */}
          <div className="flex items-center gap-4 shrink-0">
            <button
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => {});
                } else {
                  document.exitFullscreen().catch(() => {});
                }
              }}
              className="w-10 h-10 rounded-full bg-zinc-50 border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
              title="Toggle Focus Mode"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
            </button>

            <AnimatePresence>
              {isSearching ? (
                <motion.div 
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 240, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  className="relative"
                >
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search..."
                    className="w-full bg-white border border-mc-ink-black/50 rounded-full py-2.5 px-6 text-[14px] text-mc-ink-black focus:outline-none focus:ring-1 focus:ring-mc-ink-black"
                    onBlur={() => setIsSearching(false)}
                  />
                  <Search size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-mc-ink-black/50" />
                </motion.div>
              ) : (
                <button 
                  onClick={() => setIsSearching(true)}
                  className="w-[40px] h-[40px] rounded-full flex items-center justify-center hover:bg-black/5 transition-colors"
                >
                  <Search size={18} className="text-mc-ink-black" />
                </button>
              )}
            </AnimatePresence>

            <button className="w-[40px] h-[40px] rounded-full flex items-center justify-center hover:bg-black/5 transition-colors relative">
              <Bell size={18} className="text-mc-ink-black" />
              <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-mc-signal-orange rounded-full" />
            </button>
            <button 
              onClick={onLogout}
              className="w-[40px] h-[40px] rounded-full flex items-center justify-center hover:bg-black/5 transition-colors"
              title="Sign Out"
            >
              <LogOut size={18} className="text-mc-ink-black" />
            </button>
          </div>
        </motion.nav>
      </div>

      {/* Mobile Nav Header */}
      <div className="md:hidden fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-zinc-200/50 p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 flex items-center justify-center text-white font-bold text-[14px]">
            IT
          </div>
          <span className="text-[17px] font-bold text-zinc-900 tracking-tight">InternTrack</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileMenuOpen(true)}>
            <Menu size={24} className="text-zinc-900" />
          </button>
        </div>
      </div>

      {/* Mobile Full Screen Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-[60] bg-mc-lifted-cream flex flex-col p-6"
          >
            <div className="flex items-center justify-between mb-12">
              <span className="text-[18px] font-bold text-mc-ink-black">Menu</span>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-full bg-black/5"
              >
                <X size={24} className="text-mc-ink-black" />
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
                  className={`text-left text-[24px] font-medium tracking-mc-tight transition-colors ${
                    activeTab === item.id ? 'text-mc-signal-orange' : 'text-mc-ink-black'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <div className="h-px bg-black/10 my-4" />
              <button
                onClick={onLogout}
                className="text-left text-[18px] font-medium text-red-600 flex items-center gap-2"
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
