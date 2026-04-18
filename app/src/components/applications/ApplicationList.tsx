import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Building2, 
  MapPin, 
  Calendar, 
  Star,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  ChevronRight
} from 'lucide-react';
import type { Application } from '@/types';

interface ApplicationListProps {
  applications: Application[];
  onEdit: (app: Application) => void;
  onDelete: (id: string) => void;
  onView: (app: Application) => void;
  onAdd: () => void;
  onStatusChange: (id: string, newStatus: string) => void;
}

const statusOrder = ['Applied', 'Phone Screen', 'Interview', 'Technical', 'Offer', 'Rejected', 'Withdrawn', 'Ghosted'];

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Offer': return 'bg-apple-blue/10 text-apple-blue border-apple-blue/20';
    case 'Applied': return 'bg-apple-gray dark:bg-zinc-800 text-apple-near-black/70 dark:text-white/70 border-black/5 dark:border-white/5';
    case 'Interview': 
    case 'Phone Screen':
    case 'Technical': return 'bg-apple-near-black text-white dark:bg-white dark:text-apple-near-black border-transparent';
    case 'Rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
    default: return 'bg-apple-gray dark:bg-zinc-800 text-apple-near-black/40 dark:text-white/40 border-black/5 dark:border-white/5';
  }
};

export function ApplicationList({ applications, onEdit, onDelete, onView, onAdd, onStatusChange }: ApplicationListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('date');
  const [showFilters, setShowFilters] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const filteredApplications = useMemo(() => {
    let filtered = [...applications];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        app =>
          app.company_name.toLowerCase().includes(query) ||
          app.job_title.toLowerCase().includes(query) ||
          app.location?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'All') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    switch (sortBy) {
      case 'date':
        filtered.sort((a, b) => new Date(b.applied_date).getTime() - new Date(a.applied_date).getTime());
        break;
      case 'company':
        filtered.sort((a, b) => a.company_name.localeCompare(b.company_name));
        break;
      case 'status':
        filtered.sort((a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
    }

    return filtered;
  }, [applications, searchQuery, statusFilter, sortBy]);

  return (
    <div className="space-y-12 pb-20">
      {/* Header - Apple Style */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div className="text-left">
          <h1 className="display-hero text-apple-near-black dark:text-white mb-2">Applications.</h1>
          <p className="text-[21px] text-apple-near-black/60 dark:text-white/60 tracking-apple-tight">
            {filteredApplications.length} opportunities discovered.
          </p>
        </div>
        
        <motion.button
          onClick={onAdd}
          className="apple-pill-filled w-fit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Add Application
        </motion.button>
      </motion.div>

      {/* Search and Filters - Clean Apple Style */}
      <motion.div
        className="apple-card p-4 bg-white dark:bg-apple-near-black flex flex-col md:flex-row gap-4 items-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <div className="flex-1 relative w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-apple-near-black/20 dark:text-white/20" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search companies, positions..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-apple-gray dark:bg-zinc-900 text-apple-near-black dark:text-white border-none focus:ring-2 focus:ring-apple-blue/20 transition-all placeholder:text-apple-near-black/30 dark:placeholder:text-white/30"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${
            showFilters ? 'bg-apple-blue text-white' : 'bg-apple-gray dark:bg-zinc-900 text-apple-near-black dark:text-white'
          }`}
        >
          <Filter size={18} />
          Filters
        </button>
      </motion.div>

      {/* Filter Options Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="apple-card p-6 bg-white dark:bg-apple-near-black grid grid-cols-1 md:grid-cols-2 gap-8 ring-1 ring-black/5 dark:ring-white/5">
              <div className="space-y-4">
                <label className="text-sm font-bold text-apple-near-black dark:text-white uppercase tracking-wider">Status</label>
                <div className="flex flex-wrap gap-2">
                  {['All', ...statusOrder].map(status => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        statusFilter === status 
                          ? 'bg-apple-blue text-white' 
                          : 'bg-apple-gray dark:bg-zinc-900 text-apple-near-black dark:text-white hover:bg-black/5'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-sm font-bold text-apple-near-black dark:text-white uppercase tracking-wider">Sort By</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'date', label: 'Recent' },
                    { id: 'company', label: 'Company' },
                    { id: 'status', label: 'Status' },
                    { id: 'rating', label: 'Priority' }
                  ].map(option => (
                    <button
                      key={option.id}
                      onClick={() => setSortBy(option.id)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        sortBy === option.id 
                          ? 'bg-apple-blue text-white' 
                          : 'bg-apple-gray dark:bg-zinc-900 text-apple-near-black dark:text-white hover:bg-black/5'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Applications Grid - Product Tile Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredApplications.map((app, index) => (
            <motion.div
              key={app.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05, duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="apple-card apple-card-lift bg-white dark:bg-apple-near-black p-8 group overflow-hidden flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-8">
                <div className="w-14 h-14 rounded-2xl bg-apple-gray dark:bg-zinc-800 flex items-center justify-center text-apple-near-black dark:text-white shadow-inner transition-transform group-hover:scale-110 duration-500">
                  <Building2 size={28} strokeWidth={1.5} />
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-1.5 h-1.5 rounded-full ${i < (app.rating || 0) ? 'bg-apple-blue' : 'bg-apple-near-black/10 dark:bg-white/10'}`} 
                    />
                  ))}
                </div>
              </div>

              <div className="flex-1 space-y-2">
                <h3 className="text-[24px] font-bold text-apple-near-black dark:text-white tracking-apple-tight leading-tight group-hover:text-apple-blue transition-colors">
                  {app.company_name}
                </h3>
                <p className="text-[17px] font-medium text-apple-near-black/50 dark:text-white/50 tracking-apple-tight">
                  {app.job_title}
                </p>
                
                <div className="pt-4 flex flex-wrap gap-4 items-center">
                  <span className="flex items-center gap-1.5 text-[14px] text-apple-near-black/40 dark:text-white/40">
                    <MapPin size={14} />
                    {app.location || 'Remote'}
                  </span>
                  <span className="flex items-center gap-1.5 text-[14px] text-apple-near-black/40 dark:text-white/40">
                    <Calendar size={14} />
                    {new Date(app.applied_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                <select
                  value={app.status}
                  onChange={(e) => onStatusChange(app.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className={`appearance-none cursor-pointer px-4 py-1.5 pt-2 rounded-full text-[13px] font-bold uppercase tracking-widest border border-black/10 dark:border-white/10 transition-all hover:opacity-80 outline-none ${getStatusStyles(app.status)}`}
                >
                  {statusOrder.map(s => (
                    <option key={s} value={s} className="bg-white dark:bg-black text-black dark:text-white uppercase font-semibold">
                      {s}
                    </option>
                  ))}
                </select>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onView(app)}
                    className="p-2 rounded-full hover:bg-apple-gray dark:hover:bg-zinc-800 text-apple-near-black/40 dark:text-white/40 hover:text-apple-blue transition-all"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => onEdit(app)}
                    className="p-2 rounded-full hover:bg-apple-gray dark:hover:bg-zinc-800 text-apple-near-black/40 dark:text-white/40 hover:text-apple-blue transition-all"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => onDelete(app.id)}
                    className="p-2 rounded-full hover:bg-apple-gray dark:hover:bg-zinc-800 text-apple-near-black/40 dark:text-white/40 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredApplications.length === 0 && (
        <motion.div
          className="text-center py-24 apple-card bg-white dark:bg-apple-near-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="w-20 h-20 rounded-full bg-apple-gray dark:bg-zinc-800 flex items-center justify-center mx-auto mb-8 text-apple-near-black/20 dark:text-white/20">
            <Building2 size={40} />
          </div>
          <h3 className="section-heading text-apple-near-black dark:text-white mb-2">No results yet.</h3>
          <p className="text-[17px] text-apple-near-black/40 dark:text-white/40 mb-10 max-w-md mx-auto">
            {searchQuery || statusFilter !== 'All'
              ? 'Try refining your search terms or filters to find what you’re looking for.'
              : 'Begin your professional journey by adding your first application today.'}
          </p>
          <button
            onClick={onAdd}
            className="apple-pill-filled px-10"
          >
            Add Application
          </button>
        </motion.div>
      )}
    </div>
  );
}
