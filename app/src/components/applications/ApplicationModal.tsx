import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star } from 'lucide-react';
import type { Application, ApplicationStatus, EmploymentType } from '@/types';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (application: Partial<Application>) => void;
  application?: Application | null;
}

const statuses: ApplicationStatus[] = ['Applied', 'Phone Screen', 'Interview', 'Technical', 'Offer', 'Rejected', 'Withdrawn', 'Ghosted'];
const employmentTypes: EmploymentType[] = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'];

export function ApplicationModal({ isOpen, onClose, onSave, application }: ApplicationModalProps) {
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
    interview_date: '',
    recruiter_name: '',
    recruiter_email: '',
    recruiter_phone: '',
    notes: '',
    rating: 0,
  });

  useEffect(() => {
    if (application) {
      setFormData({
        ...application,
        applied_date: application.applied_date?.split('T')[0],
        deadline_date: application.deadline_date?.split('T')[0],
        interview_date: application.interview_date?.split('T')[0]?.slice(0, 16),
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
        interview_date: '',
        recruiter_name: '',
        recruiter_email: '',
        recruiter_phone: '',
        notes: '',
        rating: 0,
      });
    }
  }, [application]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      console.log('Attempting to save application:', formData);
      await onSave(formData);
      // Wait a tiny bit for UI to finish closing before resetting button
      setTimeout(() => setIsSaving(false), 300);
    } catch (error) {
      console.error('Modal Save Error:', error);
      setIsSaving(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden apple-card bg-white dark:bg-apple-near-black flex flex-col shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b border-black/5 dark:border-white/5 bg-white/80 dark:bg-apple-near-black/80 backdrop-blur-xl sticky top-0 z-10">
              <div>
                <h2 className="text-[28px] font-bold tracking-apple-tight text-apple-near-black dark:text-white">
                  {application ? 'Edit Experience.' : 'New Opportunity.'}
                </h2>
                <p className="text-[17px] text-apple-near-black/40 dark:text-white/40 font-medium">
                  {application ? 'Refine your application details.' : 'Capture the details of your next journey.'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-apple-gray dark:bg-zinc-800 flex items-center justify-center text-apple-near-black/40 dark:text-white/40 hover:text-apple-near-black dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-8 space-y-12 pb-24">
                {/* Section: Primary Details */}
                <section className="space-y-6">
                  <h3 className="text-[13px] font-bold text-apple-blue uppercase tracking-[0.2em]">Core Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                    <div className="space-y-2">
                       <label className="text-[14px] font-semibold text-apple-near-black dark:text-white ml-1">Company Name</label>
                       <input
                         type="text"
                         value={formData.company_name}
                         onChange={(e) => updateField('company_name', e.target.value)}
                         className="w-full px-4 py-3 rounded-xl bg-apple-gray dark:bg-zinc-900 border-none focus:ring-2 focus:ring-apple-blue/20 transition-all"
                         placeholder="e.g. Apple, Google, Tesla"
                         required
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[14px] font-semibold text-apple-near-black dark:text-white ml-1">Position / Role</label>
                       <input
                         type="text"
                         value={formData.job_title}
                         onChange={(e) => updateField('job_title', e.target.value)}
                         className="w-full px-4 py-3 rounded-xl bg-apple-gray dark:bg-zinc-900 border-none focus:ring-2 focus:ring-apple-blue/20 transition-all"
                         placeholder="e.g. Software Engineer Intern"
                         required
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[14px] font-semibold text-apple-near-black dark:text-white ml-1">Location</label>
                       <input
                         type="text"
                         value={formData.location}
                         onChange={(e) => updateField('location', e.target.value)}
                         className="w-full px-4 py-3 rounded-xl bg-apple-gray dark:bg-zinc-900 border-none focus:ring-2 focus:ring-apple-blue/20 transition-all"
                         placeholder="e.g. Cupertino, CA or Remote"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[14px] font-semibold text-apple-near-black dark:text-white ml-1">Job Link</label>
                       <input
                         type="url"
                         value={formData.job_url}
                         onChange={(e) => updateField('job_url', e.target.value)}
                         className="w-full px-4 py-3 rounded-xl bg-apple-gray dark:bg-zinc-900 border-none focus:ring-2 focus:ring-apple-blue/20 transition-all text-apple-blue"
                         placeholder="https://career.apple.com/..."
                       />
                    </div>
                  </div>
                </section>

                {/* Section: Status & Timeline */}
                <section className="space-y-6">
                  <h3 className="text-[13px] font-bold text-apple-blue uppercase tracking-[0.2em]">Status & Timeline</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-2">
                      <label className="text-[14px] font-semibold text-apple-near-black dark:text-white ml-1">Current State</label>
                      <select
                        value={formData.status}
                        onChange={(e) => updateField('status', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-apple-gray dark:bg-zinc-900 border-none focus:ring-2 focus:ring-apple-blue/20 transition-all font-medium"
                      >
                        {statuses.map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[14px] font-semibold text-apple-near-black dark:text-white ml-1">Date Applied</label>
                      <input
                        type="date"
                        value={formData.applied_date}
                        onChange={(e) => updateField('applied_date', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-apple-gray dark:bg-zinc-900 border-none focus:ring-2 focus:ring-apple-blue/20 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[14px] font-semibold text-apple-near-black dark:text-white ml-1">Deadline (Optional)</label>
                      <input
                        type="date"
                        value={formData.deadline_date}
                        onChange={(e) => updateField('deadline_date', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-apple-gray dark:bg-zinc-900 border-none focus:ring-2 focus:ring-apple-blue/20 transition-all font-medium opacity-60"
                      />
                    </div>
                  </div>
                </section>

                {/* Section: Professional Details */}
                <section className="space-y-6">
                  <h3 className="text-[13px] font-bold text-apple-blue uppercase tracking-[0.2em]">Professional Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[14px] font-semibold text-apple-near-black dark:text-white ml-1">Employment Type</label>
                      <select
                        value={formData.employment_type}
                        onChange={(e) => updateField('employment_type', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-apple-gray dark:bg-zinc-900 border-none focus:ring-2 focus:ring-apple-blue/20 transition-all font-medium"
                      >
                        {employmentTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[14px] font-semibold text-apple-near-black dark:text-white ml-1">Salary / Compensation</label>
                      <input
                        type="text"
                        value={formData.salary_range}
                        onChange={(e) => updateField('salary_range', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-apple-gray dark:bg-zinc-900 border-none focus:ring-2 focus:ring-apple-blue/20 transition-all font-medium"
                        placeholder="e.g. $8,000 / mo"
                      />
                    </div>
                  </div>
                </section>

                {/* Section: Priority */}
                <section className="space-y-4">
                  <h3 className="text-[13px] font-bold text-apple-blue uppercase tracking-[0.2em]">Priority</h3>
                  <div className="flex items-center gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => updateField('rating', star === formData.rating ? 0 : star)}
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                          star <= (formData.rating || 0)
                            ? 'bg-apple-blue text-white shadow-lg shadow-apple-blue/20'
                            : 'bg-apple-gray dark:bg-zinc-800 text-apple-near-black/20 dark:text-white/20'
                        }`}
                      >
                        <Star size={24} fill={star <= (formData.rating || 0) ? 'white' : 'transparent'} strokeWidth={1.5} />
                      </button>
                    ))}
                  </div>
                </section>

                {/* Section: Personal Notes */}
                <section className="space-y-4">
                  <h3 className="text-[13px] font-bold text-apple-blue uppercase tracking-[0.2em]">Personal Notes</h3>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    className="w-full px-6 py-4 rounded-3xl bg-apple-gray dark:bg-zinc-900 border-none focus:ring-2 focus:ring-apple-blue/20 transition-all min-h-[160px] text-[17px] tracking-apple-tight"
                    placeholder="Add your reflections, goals, or important details here..."
                  />
                </section>
              </div>

              {/* Actions Footer */}
              <div className="absolute bottom-0 left-0 right-0 p-8 pt-0 bg-gradient-to-t from-white dark:from-apple-near-black via-white dark:via-apple-near-black to-transparent pointer-events-none">
                <div className="bg-white/80 dark:bg-apple-near-black/80 backdrop-blur-xl p-4 rounded-3xl border border-black/5 dark:border-white/5 shadow-2xl flex items-center justify-between pointer-events-auto">
                   <button
                    type="button"
                    onClick={onClose}
                    className="px-8 py-3 rounded-full text-[15px] font-bold text-apple-near-black/60 dark:text-white/60 hover:text-apple-near-black dark:hover:text-white transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className={`apple-pill-filled px-10 flex items-center gap-2 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isSaving ? (
                      <>
                        <motion.div
                          className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        />
                        Saving...
                      </>
                    ) : (
                      <>{application ? 'Update Application' : 'Save Application'}</>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
