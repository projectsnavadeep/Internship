import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star } from 'lucide-react';
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
    rating: 0,
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
        rating: 0,
      });
    }
  }, [application, isOpen]);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    if (!formData.company_name?.trim() || !formData.job_title?.trim()) {
      alert('Company Name and Job Title are required.');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
      setIsSaving(false);
    } catch (error: any) {
      console.error('Save failed:', error);
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
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-black/5 dark:border-white/5">
              <h2 className="text-xl font-bold text-apple-near-black dark:text-white">
                {application ? 'Edit Application' : 'New Application'}
              </h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">

              {/* Company & Position */}
              <section className="space-y-6">
                <h3 className="text-[13px] font-bold text-apple-blue uppercase tracking-[0.2em]">Company & Position</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[14px] font-semibold text-apple-near-black dark:text-white ml-1">Company Name *</label>
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => updateField('company_name', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-apple-gray dark:bg-zinc-800 border-none focus:ring-2 focus:ring-apple-blue/20 transition-all font-medium"
                      placeholder="e.g. Google"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[14px] font-semibold text-apple-near-black dark:text-white ml-1">Job Title *</label>
                    <input
                      type="text"
                      value={formData.job_title}
                      onChange={(e) => updateField('job_title', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-apple-gray dark:bg-zinc-800 border-none focus:ring-2 focus:ring-apple-blue/20 transition-all font-medium"
                      placeholder="e.g. Software Engineer Intern"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[14px] font-semibold text-apple-near-black dark:text-white ml-1">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => updateField('location', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-apple-gray dark:bg-zinc-800 border-none focus:ring-2 focus:ring-apple-blue/20 transition-all font-medium"
                      placeholder="e.g. Bangalore, India"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[14px] font-semibold text-apple-near-black dark:text-white ml-1">Job URL</label>
                    <input
                      type="url"
                      value={formData.job_url}
                      onChange={(e) => updateField('job_url', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-apple-gray dark:bg-zinc-800 border-none focus:ring-2 focus:ring-apple-blue/20 transition-all font-medium"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </section>

              {/* Status & Dates */}
              <section className="space-y-6">
                <h3 className="text-[13px] font-bold text-apple-blue uppercase tracking-[0.2em]">Status & Dates</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[14px] font-semibold text-apple-near-black dark:text-white ml-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => updateField('status', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-apple-gray dark:bg-zinc-800 border-none focus:ring-2 focus:ring-apple-blue/20 transition-all font-medium"
                    >
                      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[14px] font-semibold text-apple-near-black dark:text-white ml-1">Applied Date</label>
                    <input
                      type="date"
                      value={formData.applied_date}
                      onChange={(e) => updateField('applied_date', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-apple-gray dark:bg-zinc-800 border-none focus:ring-2 focus:ring-apple-blue/20 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[14px] font-semibold text-apple-near-black dark:text-white ml-1">Deadline</label>
                    <input
                      type="date"
                      value={formData.deadline_date}
                      onChange={(e) => updateField('deadline_date', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-apple-gray dark:bg-zinc-800 border-none focus:ring-2 focus:ring-apple-blue/20 transition-all font-medium"
                    />
                  </div>
                </div>
              </section>

              {/* Professional Details */}
              <section className="space-y-6">
                <h3 className="text-[13px] font-bold text-apple-blue uppercase tracking-[0.2em]">Professional Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[14px] font-semibold text-apple-near-black dark:text-white ml-1">Employment Type</label>
                    <select
                      value={formData.employment_type}
                      onChange={(e) => updateField('employment_type', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-apple-gray dark:bg-zinc-800 border-none focus:ring-2 focus:ring-apple-blue/20 transition-all font-medium"
                    >
                      {employmentTypes.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[14px] font-semibold text-apple-near-black dark:text-white ml-1">Salary / Compensation</label>
                    <input
                      type="text"
                      value={formData.salary_range}
                      onChange={(e) => updateField('salary_range', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-apple-gray dark:bg-zinc-800 border-none focus:ring-2 focus:ring-apple-blue/20 transition-all font-medium"
                      placeholder="e.g. ₹25,000/mo"
                    />
                  </div>
                </div>
              </section>

              {/* Recruiter Info */}
              <section className="space-y-6">
                <h3 className="text-[13px] font-bold text-apple-blue uppercase tracking-[0.2em]">Recruiter Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[14px] font-semibold text-apple-near-black dark:text-white ml-1">Name</label>
                    <input
                      type="text"
                      value={formData.recruiter_name}
                      onChange={(e) => updateField('recruiter_name', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-apple-gray dark:bg-zinc-800 border-none focus:ring-2 focus:ring-apple-blue/20 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[14px] font-semibold text-apple-near-black dark:text-white ml-1">Email</label>
                    <input
                      type="email"
                      value={formData.recruiter_email}
                      onChange={(e) => updateField('recruiter_email', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-apple-gray dark:bg-zinc-800 border-none focus:ring-2 focus:ring-apple-blue/20 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[14px] font-semibold text-apple-near-black dark:text-white ml-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.recruiter_phone}
                      onChange={(e) => updateField('recruiter_phone', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-apple-gray dark:bg-zinc-800 border-none focus:ring-2 focus:ring-apple-blue/20 transition-all font-medium"
                    />
                  </div>
                </div>
              </section>

              {/* Priority Rating */}
              <section className="space-y-4">
                <h3 className="text-[13px] font-bold text-apple-blue uppercase tracking-[0.2em]">Priority</h3>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => updateField('rating', formData.rating === star ? 0 : star)}
                      className="transition-all hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 ${(formData.rating || 0) >= star ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-zinc-600'}`}
                      />
                    </button>
                  ))}
                </div>
              </section>

              {/* Notes */}
              <section className="space-y-4">
                <h3 className="text-[13px] font-bold text-apple-blue uppercase tracking-[0.2em]">Notes</h3>
                <textarea
                  value={formData.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-apple-gray dark:bg-zinc-800 border-none focus:ring-2 focus:ring-apple-blue/20 transition-all font-medium resize-none"
                  placeholder="Any additional notes..."
                />
              </section>

              {/* Description */}
              <section className="space-y-4">
                <h3 className="text-[13px] font-bold text-apple-blue uppercase tracking-[0.2em]">Job Description</h3>
                <textarea
                  value={formData.job_description}
                  onChange={(e) => updateField('job_description', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-apple-gray dark:bg-zinc-800 border-none focus:ring-2 focus:ring-apple-blue/20 transition-all font-medium resize-none"
                  placeholder="Paste job description here..."
                />
              </section>
            </form>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-8 py-5 border-t border-black/5 dark:border-white/5 bg-apple-gray/50 dark:bg-zinc-950/50">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-[14px] font-semibold text-apple-near-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSaving}
                className="px-8 py-2.5 rounded-xl text-[14px] font-semibold bg-apple-blue text-white hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-apple-blue/20"
              >
                {isSaving ? 'Saving...' : application ? 'Update' : 'Save Application'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
