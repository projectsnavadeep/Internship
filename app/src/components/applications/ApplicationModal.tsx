import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { InlineLoader } from '@/components/shared/PremiumLoader';
import { logError, createApplication, updateApplication } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Application, ApplicationStatus, EmploymentType } from '@/types';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (application: Partial<Application>) => void;
  application?: Application | null;
  userId?: string;
}

const statuses: ApplicationStatus[] = ['Applied', 'Phone Screen', 'Interview', 'Technical', 'Offer', 'Rejected', 'Withdrawn', 'Ghosted'];
const employmentTypes: EmploymentType[] = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];

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
            className="relative w-full max-w-2xl bg-mc-canvas-cream dark:bg-zinc-900 rounded-[40px] shadow-mc-deep overflow-hidden border border-black/5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-10 py-8 border-b border-mc-ink-black/10">
              <h2 className="text-[36px] tracking-mc-tight leading-none font-medium text-mc-ink-black dark:text-white">
                {application ? 'Edit Application' : 'New Application'}
              </h2>
              <button onClick={onClose} className="w-[48px] h-[48px] rounded-full flex items-center justify-center bg-white hover:bg-black/5 transition-colors border border-mc-ink-black/10">
                <X className="w-5 h-5 text-mc-ink-black" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-6 md:px-10 md:py-10 space-y-12 max-h-[70vh] overflow-y-auto">

              {/* Company & Position */}
              <section className="space-y-6">
                <div className="mc-eyebrow flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-mc-light-signal-orange" />COMPANY & POSITION</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[14px] font-semibold text-mc-ink-black ml-4">Company Name *</label>
                    <input type="text" value={formData.company_name} onChange={(e) => updateField('company_name', e.target.value)}
                      className="w-full h-[56px] px-6 rounded-full bg-white border border-mc-ink-black/20 focus:border-mc-ink-black focus:ring-1 focus:ring-mc-ink-black transition-all font-medium text-[16px] text-mc-ink-black"
                      placeholder="e.g. Google" required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[14px] font-semibold text-mc-ink-black ml-4">Job Title *</label>
                    <input type="text" value={formData.job_title} onChange={(e) => updateField('job_title', e.target.value)}
                      className="w-full h-[56px] px-6 rounded-full bg-white border border-mc-ink-black/20 focus:border-mc-ink-black focus:ring-1 focus:ring-mc-ink-black transition-all font-medium text-[16px] text-mc-ink-black"
                      placeholder="e.g. Software Engineer" required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[14px] font-semibold text-mc-ink-black ml-4">Location</label>
                    <input type="text" value={formData.location} onChange={(e) => updateField('location', e.target.value)}
                      className="w-full h-[56px] px-6 rounded-full bg-white border border-mc-ink-black/20 focus:border-mc-ink-black focus:ring-1 focus:ring-mc-ink-black transition-all font-medium text-[16px] text-mc-ink-black"
                      placeholder="e.g. New York" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[14px] font-semibold text-mc-ink-black ml-4">Job URL</label>
                    <input type="url" value={formData.job_url} onChange={(e) => updateField('job_url', e.target.value)}
                      className="w-full h-[56px] px-6 rounded-full bg-white border border-mc-ink-black/20 focus:border-mc-ink-black focus:ring-1 focus:ring-mc-ink-black transition-all font-medium text-[16px] text-mc-ink-black"
                      placeholder="https://..." />
                  </div>
                </div>
              </section>

              {/* Status & Dates */}
              <section className="space-y-6">
                <div className="mc-eyebrow flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-mc-light-signal-orange" />STATUS & DATES</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <label className="text-[14px] font-semibold text-mc-ink-black ml-4">Status</label>
                    <select value={formData.status} onChange={(e) => updateField('status', e.target.value)}
                      className="w-full h-[56px] px-6 rounded-full bg-white border border-mc-ink-black/20 focus:border-mc-ink-black focus:ring-1 focus:ring-mc-ink-black transition-all font-medium text-[16px] text-mc-ink-black appearance-none">
                      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[14px] font-semibold text-mc-ink-black ml-4">Applied</label>
                    <input type="date" value={formData.applied_date} onChange={(e) => updateField('applied_date', e.target.value)}
                      className="w-full h-[56px] px-6 rounded-full bg-white border border-mc-ink-black/20 focus:border-mc-ink-black transition-all font-medium text-[16px] text-mc-ink-black" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[14px] font-semibold text-mc-ink-black ml-4">Deadline</label>
                    <input type="date" value={formData.deadline_date} onChange={(e) => updateField('deadline_date', e.target.value)}
                      className="w-full h-[56px] px-6 rounded-full bg-white border border-mc-ink-black/20 focus:border-mc-ink-black transition-all font-medium text-[16px] text-mc-ink-black" />
                  </div>
                </div>
              </section>

              {/* Details */}
              <section className="space-y-6">
                <div className="mc-eyebrow flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-mc-light-signal-orange" />DETAILS</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-[14px] font-semibold text-mc-ink-black ml-4">Type</label>
                    <select value={formData.employment_type} onChange={(e) => updateField('employment_type', e.target.value)}
                      className="w-full h-[56px] px-6 rounded-full bg-white border border-mc-ink-black/20 focus:border-mc-ink-black transition-all font-medium text-[16px] text-mc-ink-black appearance-none">
                      {employmentTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[14px] font-semibold text-mc-ink-black ml-4">Salary</label>
                    <input type="text" value={formData.salary_range} onChange={(e) => updateField('salary_range', e.target.value)}
                      className="w-full h-[56px] px-6 rounded-full bg-white border border-mc-ink-black/20 focus:border-mc-ink-black transition-all font-medium text-[16px] text-mc-ink-black" />
                  </div>
                </div>
              </section>

              {/* Notes */}
              <section className="space-y-4">
                <div className="mc-eyebrow flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-mc-light-signal-orange" />NOTES</div>
                <textarea value={formData.notes} onChange={(e) => updateField('notes', e.target.value)} rows={4}
                  className="w-full p-6 rounded-[24px] bg-white border border-mc-ink-black/20 focus:border-mc-ink-black transition-all font-medium text-[16px] text-mc-ink-black resize-none" placeholder="Add some context..." />
              </section>

              {/* Submit / Footer Actions */}
              <div className="flex flex-col-reverse md:flex-row items-center justify-end gap-3 pt-8 pb-4 border-t border-mc-ink-black/10">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="w-full md:w-auto mc-pill-outline py-3"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="w-full md:w-auto mc-pill-ink py-3 flex items-center justify-center gap-2"
                >
                  {isSaving && <InlineLoader size={16} />}
                  {isSaving ? 'Processing' : application ? 'Confirm Changes' : 'Add Application'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
