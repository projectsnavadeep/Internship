import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Briefcase, 
  Calendar, 
  FileText, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  ShieldCheck,
  ShieldHalf,
  Users
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  userName?: string;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  isAdmin?: boolean;
}

const studentNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'applications', label: 'Applications', icon: Briefcase },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const adminNavItems = [
  { id: 'admin', label: 'Global Analytics', icon: ShieldCheck },
  { id: 'users', label: 'User Registry', icon: Users },
  { id: 'security', label: 'Security & Compliance', icon: ShieldHalf },
  { id: 'admin-settings', label: 'System Console', icon: Settings },
];

export function Sidebar({ activeTab, onTabChange, onLogout, userName, collapsed, setCollapsed, isAdmin }: SidebarProps) {
  const navItems = isAdmin ? adminNavItems : studentNavItems;

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        className="macos-sidebar hidden md:flex flex-col pt-4"
        initial={false}
        animate={{ width: collapsed ? 80 : 260 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
      {/* Sidebar Header / Logo */}
      <div className="px-6 py-4 flex items-center justify-between">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-lg bg-apple-blue flex items-center justify-center text-white shadow-sm">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="text-lg font-bold tracking-apple-tight text-apple-near-black dark:text-white">
                InternTrack
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-apple-near-black/50 dark:text-white/50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </motion.button>
      </div>

      {/* Search Bar - Apple Style */}
      <div className="px-4 mt-2 mb-4">
        <div className={`relative flex items-center rounded-md bg-black/5 dark:bg-white/5 px-3 py-1.5 transition-all ${collapsed ? 'justify-center' : ''}`}>
          <Search size={16} className="text-apple-near-black/40 dark:text-white/40" />
          {!collapsed && (
            <input 
              type="text" 
              placeholder="Search" 
              className="ml-2 bg-transparent border-none text-sm focus:outline-none w-full placeholder:text-apple-near-black/30 dark:placeholder:text-white/30"
            />
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5 mt-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          const isAdminItem = item.id === 'admin';
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`relative w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all group ${
                isActive 
                  ? isAdminItem
                    ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                    : 'bg-black/10 dark:bg-white/15 text-apple-near-black dark:text-white' 
                  : 'text-apple-near-black/70 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Icon 
                className={`w-[18px] h-[18px] transition-colors ${
                  isActive 
                    ? isAdminItem ? 'text-purple-500' : 'text-apple-blue' 
                    : isAdminItem ? 'text-purple-400/50' : 'text-apple-near-black/50 dark:text-white/50'
                }`} 
              />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`text-[14px] font-medium tracking-apple-body ${isAdminItem ? 'font-semibold' : ''}`}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Selection Dot */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className={`absolute left-[2px] top-1/2 -translate-y-1/2 w-1 h-4 rounded-full ${
                    isAdminItem ? 'bg-purple-500' : 'bg-apple-blue'
                  }`}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Profile Section */}
      <div className="mt-auto px-4 py-6 border-t border-black/5 dark:border-white/5">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-9 h-9 rounded-full bg-apple-gray dark:bg-zinc-800 flex items-center justify-center border border-black/5 dark:border-white/5 shadow-sm overflow-hidden">
            <span className="text-xs font-semibold text-apple-near-black/70 dark:text-white/70">
              {userName?.charAt(0)?.toUpperCase()}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-apple-near-black dark:text-white truncate">
                  {userName || 'User'}
                </p>
                {isAdmin && (
                  <span className="text-[9px] font-bold bg-purple-500/15 text-purple-500 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    Admin
                  </span>
                )}
              </div>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onLogout();
                }}
                className="group relative flex items-center gap-2 mt-1 w-full text-left bg-transparent"
              >
                <div className="absolute -inset-x-2 -inset-y-1.5 rounded-md bg-transparent group-hover:bg-red-500/10 dark:group-hover:bg-red-500/20 transition-colors pointer-events-none" />
                <span className="text-[12px] font-medium text-apple-near-black/50 dark:text-white/50 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors relative z-10 flex items-center gap-1.5 w-full">
                  Sign Out <LogOut size={12} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </button>
            </div>
          )}
          {!collapsed && (
            <button className="text-apple-near-black/40 dark:text-white/40 hover:text-apple-blue transition-colors">
              <Bell size={16} />
            </button>
          )}
        </div>
      </div>
      </motion.aside>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/80 dark:bg-black/80 backdrop-blur-3xl border-t border-black/5 dark:border-white/5 z-50 flex items-center justify-around px-2 py-3 pb-safe">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          const isAdminItem = item.id === 'admin';
          
          return (
            <button
              key={`mobile-${item.id}`}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                isActive 
                  ? isAdminItem ? 'text-purple-500' : 'text-apple-blue' 
                  : 'text-apple-near-black/50 dark:text-white/50'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-medium tracking-tight">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
