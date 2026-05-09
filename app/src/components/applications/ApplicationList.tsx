import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Building2, 
  MapPin, 
  Calendar, 
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { ApplicationListSkeleton } from '../shared/ViewSkeletons';
import type { Application } from '@/types';

interface ApplicationListProps {
  applications: Application[];
  onEdit: (app: Application) => void;
  onDelete: (id: string) => void;
  onView: (app: Application) => void;
  onAdd: () => void;
  onStatusChange: (id: string, newStatus: string) => void;
  loading?: boolean;
}

const statusOrder = ['Applied', 'Phone Screen', 'Interview', 'Technical', 'Offer', 'Rejected', 'Withdrawn', 'Ghosted'];

const getStatusStyles = (status: string) => {
  switch (status) {
    case 'Offer': return 'bg-[#FCFBFA] text-mc-ink-black border border-mc-ink-black/20';
    case 'Applied': return 'bg-mc-ink-black text-white border-transparent';
    case 'Interview': 
    case 'Phone Screen':
    case 'Technical': return 'bg-mc-light-signal-orange text-white border-transparent';
    case 'Rejected': return 'bg-mc-signal-orange text-white border-transparent';
    default: return 'bg-white text-mc-ink-black/60 border border-mc-ink-black/10';
  }
};

export default function ApplicationList({ applications, onEdit, onDelete, onView, onAdd, onStatusChange, loading }: ApplicationListProps) {
  if (loading) return <ApplicationListSkeleton />;
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('date');
  const [showFilters, setShowFilters] = useState(false);

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
          <h1 className="mb-4 leading-tight">
            Applications.
          </h1>
          <p className="text-[18px] md:text-[20px] text-apple-near-black/50 dark:text-white/40 font-medium tracking-tight">
            {filteredApplications.length} opportunities discovered.
          </p>
        </div>
        
        <button
          onClick={onAdd}
          className="mc-pill-ink w-fit"
        >
          Add Application
        </button>
      </motion.div>

      {/* Search and Filters - Clean Mastercard Style */}
      <motion.div
        className="mc-nav-pill bg-white/70 dark:bg-zinc-900/70 border-none flex flex-col md:flex-row gap-4 items-center justify-between p-2 md:p-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <div className="flex-1 relative w-full border-b border-mc-ink-black/10 md:border-none">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-mc-ink-black/40 dark:text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search companies, positions..."
            className="w-full bg-transparent pl-14 pr-4 py-3 text-mc-ink-black dark:text-white border-none focus:outline-none focus:ring-0 placeholder:text-mc-ink-black/40 dark:placeholder:text-white/40 text-[16px]"
          />
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-6 py-2 rounded-full transition-all font-medium text-[16px] ${
            showFilters ? 'bg-mc-ink-black text-white' : 'bg-transparent text-mc-ink-black hover:bg-black/5 dark:text-white dark:hover:bg-white/5'
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

      {/* Applications Grid - Mastercard Pill Carousel Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {filteredApplications.map((app, index) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              className="mc-stadium-card p-10 flex flex-col justify-between group h-full relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-8 z-10 relative">
                <div className="mc-circle-portrait w-20 h-20 bg-mc-canvas-cream flex items-center justify-center text-mc-ink-black shadow-sm">
                  <Building2 size={32} strokeWidth={1.5} />
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i} 
                      className={`w-2 h-2 rounded-full ${i < (app.rating || 0) ? 'bg-mc-light-signal-orange' : 'bg-mc-ink-black/10'}`} 
                    />
                  ))}
                </div>
              </div>

              <div className="flex-1 space-y-3 z-10 relative">
                <div className="mc-eyebrow flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-mc-light-signal-orange" />
                  {app.company_name}
                </div>
                <h3 className="text-[28px] font-medium text-mc-ink-black tracking-mc-tight leading-tight group-hover:text-mc-signal-orange transition-colors cursor-pointer" onClick={() => onView(app)}>
                  {app.job_title}
                </h3>
                
                <div className="pt-4 flex flex-col gap-3">
                  <span className="flex items-center gap-2 text-[16px] text-mc-ink-black/60">
                    <MapPin size={16} />
                    {app.location || 'Remote'}
                  </span>
                  <span className="flex items-center gap-2 text-[16px] text-mc-ink-black/60">
                    <Calendar size={16} />
                    {new Date(app.applied_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
              </div>

              <div className="mt-10 pt-6 flex items-center justify-between z-10 relative">
                <select
                  value={app.status}
                  onChange={(e) => onStatusChange(app.id, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className={`appearance-none cursor-pointer px-6 py-2 rounded-full text-[14px] font-medium uppercase tracking-mc-wide transition-all outline-none ${getStatusStyles(app.status)}`}
                >
                  {statusOrder.map(s => (
                    <option key={s} value={s} className="bg-white text-mc-ink-black uppercase">
                      {s}
                    </option>
                  ))}
                </select>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onView(app)}
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 text-mc-ink-black/60 hover:text-mc-ink-black transition-all"
                  >
                    <Eye size={20} />
                  </button>
                  <button
                    onClick={() => onEdit(app)}
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5 text-mc-ink-black/60 hover:text-mc-ink-black transition-all"
                  >
                    <Edit size={20} />
                  </button>
                  <button
                    onClick={() => onDelete(app.id)}
                    className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-red-500/10 text-mc-ink-black/60 hover:text-red-500 transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>

              {/* Watermark effect */}
              <div className="absolute -bottom-8 -right-8 mc-ghost-watermark text-mc-ink-black opacity-[0.03]">
                {app.company_name.substring(0, 3).toUpperCase()}
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
