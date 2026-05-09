import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { InlineLoader } from '@/components/shared/PremiumLoader';
import { logError, createApplication, updateApplication } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Application, ApplicationStatus } from '@/types';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (application: Partial<Application>) => void;
  application?: Application | null;
  userId?: string;
}

const statuses: ApplicationStatus[] = ['Applied', 'Phone Screen', 'Interview', 'Technical', 'Offer', 'Rejected', 'Withdrawn', 'Ghosted'];

export function ApplicationModal({ isOpen, onClose, onSave, application, userId }: ApplicationModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Application>>({
    company_name: '',
    job_title: '',
    job_description: '',
    job_url: '',
    location: '',
    salary_range: '',
    employment_type: 'Internship',
    status: 'Applied',
    applied_date: new Date().toISOString().split('T')[0],
    deadline_date: '',
    recruiter_name: '',
    recruiter_email: '',
    recruiter_phone: '',
    notes: '',
    rating: 1, // Default to 1 to avoid check constraint violations
  });

  useEffect(() => {
    if (application) {
      setFormData({
        company_name: application.company_name || '',
        job_title: application.job_title || '',
        job_description: application.job_description || '',
        job_url: application.job_url || '',
        location: application.location || '',
        salary_range: application.salary_range || '',
        employment_type: application.employment_type || 'Internship',
        status: application.status || 'Applied',
        applied_date: application.applied_date || '',
        deadline_date: application.deadline_date || '',
        recruiter_name: application.recruiter_name || '',
        recruiter_email: application.recruiter_email || '',
        recruiter_phone: application.recruiter_phone || '',
        notes: application.notes || '',
        rating: application.rating || 0,
      });
    } else {
      setFormData({
        company_name: '',
        job_title: '',
        job_description: '',
        job_url: '',
        location: '',
        salary_range: '',
        employment_type: 'Internship',
        status: 'Applied',
        applied_date: new Date().toISOString().split('T')[0],
        deadline_date: '',
        recruiter_name: '',
        recruiter_email: '',
        recruiter_phone: '',
        notes: '',
        rating: 1,
      });
    }
    setIsSaving(false);
  }, [application, isOpen]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isOpen) {
        e.preventDefault();
        e.returnValue = 'You have an application open. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isOpen]);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    if (!formData.company_name?.trim() || !formData.job_title?.trim()) {
      toast.error('Company Name and Job Title are required.');
      return;
    }

    setIsSaving(true);

    try {
      if (!userId) {
        throw new Error('Authentication failure: user_id is missing. Please sign out and sign back in.');
      }

      // Build clean payload - only include non-empty values
      const payload: any = {
        user_id: userId,
        company_name: formData.company_name?.trim(),
        job_title: formData.job_title?.trim(),
      };

      // Add optional fields only if they have values
      if (formData.location?.trim()) payload.location = formData.location.trim();
      if (formData.job_url?.trim()) payload.job_url = formData.job_url.trim();
      if (formData.salary_range?.trim()) payload.salary_range = formData.salary_range.trim();
      if (formData.job_description?.trim()) payload.job_description = formData.job_description.trim();
      if (formData.notes?.trim()) payload.notes = formData.notes.trim();
      if (formData.recruiter_name?.trim()) payload.recruiter_name = formData.recruiter_name.trim();
      if (formData.recruiter_email?.trim()) payload.recruiter_email = formData.recruiter_email.trim();
      if (formData.recruiter_phone?.trim()) payload.recruiter_phone = formData.recruiter_phone.trim();
      
      if (formData.employment_type) payload.employment_type = formData.employment_type;
      if (formData.status) payload.status = formData.status;
      if (formData.applied_date) payload.applied_date = formData.applied_date;
      if (formData.deadline_date && formData.deadline_date !== '') payload.deadline_date = formData.deadline_date;
      if (formData.rating !== undefined) payload.rating = Number(formData.rating);
      
      if (application) {
        // UPDATE existing
        const data = await updateApplication(application.id, payload);
        toast.success('Database synchronized: Application updated.');
        onSave(data);
      } else {
        // INSERT new
        const data = await createApplication(payload);
        toast.success('Database synchronized: Application created.');
        onSave(data);
      }
      onClose();
    } catch (err: any) {
      console.error('CRITICAL SAVE FAILURE:', err);
      
      let errorMessage = err.message || 'Unknown database error';
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        errorMessage = 'Network connection lost or browser deadlock detected. PLEASE REFRESH THE PAGE.';
      }
      
      toast.error(`Save Failed: ${errorMessage}`);
      
      // Attempt to log the error to the database for debugging
      try {
        logError({
          errorType: application ? 'application_update' : 'application_save',
          errorMessage: err.message || 'Unknown',
          actionAttempted: application ? 'application_update' : 'application_insert',
          errorStack: JSON.stringify(err),
          userId: userId || 'unknown',
          source: 'frontend'
        });
      } catch (logErr) {
        console.error('Failed to log error to DB:', logErr);
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-10 overflow-y-auto"
          onClick={onClose}
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full max-w-3xl bg-white dark:bg-apple-near-black rounded-[48px] shadow-2xl overflow-hidden border border-black/5 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Blue Gradient Accent */}
            <div className="relative px-12 py-10 border-b border-black/5 bg-gradient-to-br from-white via-white to-blue-50/30 dark:from-apple-near-black dark:via-apple-near-black dark:to-blue-900/10">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0071E3] to-blue-400" />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-[44px] font-bold tracking-apple-tight text-apple-near-black dark:text-white leading-tight">
                    {application ? 'Edit Application.' : 'New Entry.'}
                  </h2>
                  <p className="text-[17px] font-medium text-apple-near-black/40 dark:text-white/40">
                    Syncing professional parameters to your career timeline.
                  </p>
                </div>
                <button 
                  onClick={onClose} 
                  className="w-12 h-12 rounded-full flex items-center justify-center bg-apple-gray dark:bg-zinc-800 hover:bg-black/5 dark:hover:bg-white/5 transition-all shadow-sm"
                >
                  <X className="w-5 h-5 text-apple-near-black/40 dark:text-white/40" />
                </button>
              </div>
            </div>

            {/* Form Container with Premium Scrolling */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar px-12 py-10 space-y-16">
              
              {/* Company & Position */}
              <section className="space-y-10">
                <h3 className="text-[13px] font-bold text-[#0071E3] uppercase tracking-[0.2em] border-b border-black/5 dark:border-white/5 pb-4">Identity & Role</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[13px] font-bold text-apple-near-black/30 dark:text-white/30 uppercase tracking-widest ml-1">Company Name *</label>
                    <input 
                      type="text" 
                      value={formData.company_name} 
                      onChange={(e) => updateField('company_name', e.target.value)}
                      className="w-full h-[60px] px-6 rounded-[20px] bg-apple-gray dark:bg-zinc-900 border-none focus:ring-2 focus:ring-[#0071E3]/20 transition-all font-semibold text-[17px] text-apple-near-black dark:text-white placeholder:text-apple-near-black/20"
                      placeholder="e.g. Google" 
                      required 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[13px] font-bold text-apple-near-black/30 dark:text-white/30 uppercase tracking-widest ml-1">Job Title *</label>
                    <input 
                      type="text" 
                      value={formData.job_title} 
                      onChange={(e) => updateField('job_title', e.target.value)}
                      className="w-full h-[60px] px-6 rounded-[20px] bg-apple-gray dark:bg-zinc-900 border-none focus:ring-2 focus:ring-[#0071E3]/20 transition-all font-semibold text-[17px] text-apple-near-black dark:text-white placeholder:text-apple-near-black/20"
                      placeholder="e.g. Senior SDL" 
                      required 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[13px] font-bold text-apple-near-black/30 dark:text-white/30 uppercase tracking-widest ml-1">Location</label>
                    <input 
                      type="text" 
                      value={formData.location} 
                      onChange={(e) => updateField('location', e.target.value)}
                      className="w-full h-[60px] px-6 rounded-[20px] bg-apple-gray dark:bg-zinc-900 border-none focus:ring-2 focus:ring-[#0071E3]/20 transition-all font-semibold text-[17px] text-apple-near-black dark:text-white"
                      placeholder="e.g. New York" 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[13px] font-bold text-apple-near-black/30 dark:text-white/30 uppercase tracking-widest ml-1">Career URL</label>
                    <input 
                      type="url" 
                      value={formData.job_url} 
                      onChange={(e) => updateField('job_url', e.target.value)}
                      className="w-full h-[60px] px-6 rounded-[20px] bg-apple-gray dark:bg-zinc-900 border-none focus:ring-2 focus:ring-[#0071E3]/20 transition-all font-semibold text-[17px] text-apple-near-black dark:text-white"
                      placeholder="https://..." 
                    />
                  </div>
                </div>
              </section>

              {/* Parameters */}
              <section className="space-y-10">
                <h3 className="text-[13px] font-bold text-[#0071E3] uppercase tracking-[0.2em] border-b border-black/5 dark:border-white/5 pb-4">Operational Parameters</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                  <div className="space-y-3">
                    <label className="text-[13px] font-bold text-apple-near-black/30 dark:text-white/30 uppercase tracking-widest ml-1">Status</label>
                    <div className="relative">
                      <select 
                        value={formData.status} 
                        onChange={(e) => updateField('status', e.target.value)}
                        className="w-full h-[60px] px-6 rounded-[20px] bg-apple-gray dark:bg-zinc-900 border-none focus:ring-2 focus:ring-[#0071E3]/20 transition-all font-bold text-[15px] text-apple-near-black dark:text-white appearance-none uppercase tracking-widest"
                      >
                        {statuses.map(s => <option key={s} value={s} className="bg-white dark:bg-apple-near-black text-apple-near-black dark:text-white">{s}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[13px] font-bold text-apple-near-black/30 dark:text-white/30 uppercase tracking-widest ml-1">Applied Date</label>
                    <input 
                      type="date" 
                      value={formData.applied_date} 
                      onChange={(e) => updateField('applied_date', e.target.value)}
                      className="w-full h-[60px] px-6 rounded-[20px] bg-apple-gray dark:bg-zinc-900 border-none focus:ring-2 focus:ring-[#0071E3]/20 transition-all font-semibold text-[16px] text-apple-near-black dark:text-white" 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[13px] font-bold text-apple-near-black/30 dark:text-white/30 uppercase tracking-widest ml-1">Deadline</label>
                    <input 
                      type="date" 
                      value={formData.deadline_date} 
                      onChange={(e) => updateField('deadline_date', e.target.value)}
                      className="w-full h-[60px] px-6 rounded-[20px] bg-apple-gray dark:bg-zinc-900 border-none focus:ring-2 focus:ring-[#0071E3]/20 transition-all font-semibold text-[16px] text-apple-near-black dark:text-white" 
                    />
                  </div>
                </div>
              </section>

              {/* Extra Logic */}
              <section className="space-y-10">
                <h3 className="text-[13px] font-bold text-[#0071E3] uppercase tracking-[0.2em] border-b border-black/5 dark:border-white/5 pb-4">Reflections & Compensation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-3">
                    <label className="text-[13px] font-bold text-apple-near-black/30 dark:text-white/30 uppercase tracking-widest ml-1">Salary Expectation</label>
                    <input 
                      type="text" 
                      value={formData.salary_range} 
                      onChange={(e) => updateField('salary_range', e.target.value)}
                      className="w-full h-[60px] px-6 rounded-[20px] bg-apple-gray dark:bg-zinc-900 border-none focus:ring-2 focus:ring-[#0071E3]/20 transition-all font-semibold text-[17px] text-apple-near-black dark:text-white"
                      placeholder="e.g. 150k$" 
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[13px] font-bold text-apple-near-black/30 dark:text-white/30 uppercase tracking-widest ml-1">Importance</label>
                    <div className="h-[60px] flex items-center px-6 gap-3 rounded-[20px] bg-apple-gray dark:bg-zinc-900">
                      {[...Array(5)].map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => updateField('rating', i + 1)}
                          className={`w-3 h-3 rounded-full transition-all ${i < (formData.rating || 0) ? 'bg-[#0071E3] shadow-[0_0_12px_rgba(0,113,227,0.5)] scale-125' : 'bg-black/10 dark:bg-white/10 hover:bg-[#0071E3]/30'}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[13px] font-bold text-apple-near-black/30 dark:text-white/30 uppercase tracking-widest ml-1">Notes</label>
                  <textarea 
                    value={formData.notes} 
                    onChange={(e) => updateField('notes', e.target.value)} 
                    rows={4}
                    className="w-full p-8 rounded-[32px] bg-apple-gray dark:bg-zinc-900 border-none focus:ring-2 focus:ring-[#0071E3]/20 transition-all font-medium text-[17px] text-apple-near-black dark:text-white italic placeholder:text-apple-near-black/20 resize-none" 
                    placeholder="Add some context or reflections..." 
                  />
                </div>
              </section>

              {/* Action Sentinel */}
              <div className="flex flex-col-reverse md:flex-row items-center justify-end gap-6 pt-10 pb-6 border-t border-black/5">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="w-full md:w-auto px-10 py-4 rounded-full font-bold text-[15px] text-apple-near-black/40 hover:text-apple-near-black transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full md:w-auto px-12 py-4 rounded-full bg-apple-near-black dark:bg-white text-white dark:text-apple-near-black font-bold text-[15px] shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  {isSaving && <InlineLoader size={16} />}
                  {isSaving ? 'Synchronizing' : application ? 'Confirm Changes' : 'Record Application'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
