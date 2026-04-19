import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Building2, 
  MapPin, 
  Link, 
  Calendar, 
  Plus,
  Edit,
  Trash2,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Briefcase
} from 'lucide-react';
import type { Application, InterviewNote } from '@/types';

interface ApplicationDetailsProps {
  application: Application;
  interviewNotes: InterviewNote[];
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddNote: (note: Partial<InterviewNote>) => void;
  onDeleteNote: (id: string) => void;
  onStatusChange: (id: string, newStatus: string) => void;
}

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

const outcomeIcons: Record<string, React.ReactNode> = {
  'Pending': <HelpCircle className="w-4 h-4 text-apple-near-black/30 dark:text-white/30" />,
  'Passed': <CheckCircle2 className="w-4 h-4 text-apple-blue" />,
  'Failed': <XCircle className="w-4 h-4 text-red-500" />,
  'No-show': <XCircle className="w-4 h-4 text-apple-near-black/20" />,
  'Rescheduled': <Clock className="w-4 h-4 text-apple-blue" />,
};

const statusOrder = ['Applied', 'Phone Screen', 'Interview', 'Technical', 'Offer', 'Rejected', 'Withdrawn', 'Ghosted'];

export function ApplicationDetails({ 
  application, 
  interviewNotes, 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete,
  onAddNote,
  onDeleteNote,
  onStatusChange
}: ApplicationDetailsProps) {
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState<Partial<InterviewNote>>({
    round_number: 1,
    round_name: '',
    interview_type: 'Video',
    questions_asked: '',
    answers_given: '',
    key_takeaways: '',
    follow_up_items: '',
    outcome: 'Pending',
    interviewer_name: '',
    interviewer_role: '',
    interviewer_email: '',
  });

  const handleAddNote = () => {
    onAddNote(newNote);
    setShowAddNote(false);
    setNewNote({
      round_number: interviewNotes.length + 1,
      round_name: '',
      interview_type: 'Video',
      questions_asked: '',
      answers_given: '',
      key_takeaways: '',
      follow_up_items: '',
      outcome: 'Pending',
      interviewer_name: '',
      interviewer_role: '',
      interviewer_email: '',
    });
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
            className="relative w-full max-w-4xl max-h-[95vh] overflow-hidden apple-card bg-white dark:bg-apple-near-black flex flex-col shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            {/* Action Bar */}
            <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
              <button
                onClick={onEdit}
                className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 shadow-apple flex items-center justify-center text-apple-near-black/40 dark:text-white/40 hover:text-apple-blue transition-all"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={onDelete}
                className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 shadow-apple flex items-center justify-center text-apple-near-black/40 dark:text-white/40 hover:text-red-500 transition-all"
              >
                <Trash2 size={18} />
              </button>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 shadow-apple flex items-center justify-center text-apple-near-black/40 dark:text-white/40 hover:text-apple-near-black transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-12 space-y-16 pb-32">
                {/* Hero Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pt-4">
                  <div className="space-y-4">
                    <div className="w-20 h-20 rounded-3xl bg-apple-gray dark:bg-zinc-800 flex items-center justify-center text-apple-near-black dark:text-white shadow-inner">
                      <Building2 size={40} strokeWidth={1.2} />
                    </div>
                    <div>
                      <h2 className="text-[44px] font-bold tracking-apple-tight text-apple-near-black dark:text-white leading-[1.1]">
                        {application.company_name}.
                      </h2>
                      <p className="text-[24px] font-medium text-apple-near-black/40 dark:text-white/40 tracking-apple-tight">
                        {application.job_title}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-start md:items-end gap-4">
                    <select
                      value={application.status}
                      onChange={(e) => onStatusChange(application.id, e.target.value)}
                      className={`appearance-none cursor-pointer px-6 py-2 pt-2.5 rounded-full text-[14px] font-bold uppercase tracking-widest border border-black/10 dark:border-white/10 transition-all hover:opacity-80 outline-none ${getStatusStyles(application.status)}`}
                    >
                      {statusOrder.map(s => (
                        <option key={s} value={s} className="bg-white dark:bg-black text-black dark:text-white uppercase font-bold text-[13px]">
                          {s}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1.5">
                       {[...Array(5)].map((_, i) => (
                        <div 
                          key={i} 
                          className={`w-2.5 h-2.5 rounded-full ${i < (application.rating || 0) ? 'bg-apple-blue shadow-[0_0_10px_rgba(0,113,227,0.4)]' : 'bg-apple-near-black/10 dark:bg-white/10'}`} 
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Details Section */}
                <section className="space-y-8">
                  <h3 className="text-[13px] font-bold text-apple-blue uppercase tracking-[0.2em] border-b border-black/5 dark:border-white/5 pb-4">Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                     <div className="space-y-1.5">
                       <p className="text-[13px] font-bold text-apple-near-black/30 dark:text-white/30 uppercase tracking-widest">Location</p>
                       <div className="flex items-center gap-2 text-[17px] font-semibold text-apple-near-black dark:text-white">
                         <MapPin size={18} className="text-apple-blue" />
                         {application.location || 'Remote'}
                       </div>
                     </div>
                     <div className="space-y-1.5">
                       <p className="text-[13px] font-bold text-apple-near-black/30 dark:text-white/30 uppercase tracking-widest">Employment</p>
                       <div className="flex items-center gap-2 text-[17px] font-semibold text-apple-near-black dark:text-white">
                         <Briefcase size={18} className="text-apple-blue" />
                         {application.employment_type || 'Full-time'}
                       </div>
                     </div>
                     <div className="space-y-1.5">
                       <p className="text-[13px] font-bold text-apple-near-black/30 dark:text-white/30 uppercase tracking-widest">Timeline</p>
                       <div className="flex items-center gap-2 text-[17px] font-semibold text-apple-near-black dark:text-white">
                         <Calendar size={18} className="text-apple-blue" />
                         {new Date(application.applied_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                       </div>
                     </div>
                     {application.salary_range && (
                        <div className="space-y-1.5">
                          <p className="text-[13px] font-bold text-apple-near-black/30 dark:text-white/30 uppercase tracking-widest">Compensation</p>
                          <div className="flex items-center gap-2 text-[17px] font-semibold text-apple-near-black dark:text-white">
                            <span className="text-apple-blue text-lg font-bold">$$</span>
                            {application.salary_range}
                          </div>
                        </div>
                     )}
                  </div>

                  {application.job_url && (
                    <div className="pt-6">
                      <a 
                        href={application.job_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="apple-pill-outline w-fit flex items-center gap-3 px-8 group"
                      >
                        Visit Career Page
                        <Link size={16} className="group-hover:translate-y-[-2px] group-hover:translate-x-1 transition-transform" />
                      </a>
                    </div>
                  )}
                </section>

                {/* Recruiter Section */}
                {(application.recruiter_name || application.recruiter_email || application.recruiter_phone) && (
                  <section className="space-y-8">
                     <h3 className="text-[13px] font-bold text-apple-blue uppercase tracking-[0.2em] border-b border-black/5 dark:border-white/5 pb-4">Primary Contact</h3>
                     <div className="apple-card bg-apple-gray dark:bg-zinc-900 border-none p-8 flex flex-wrap gap-12">
                       {application.recruiter_name && (
                         <div className="flex-1 min-w-[200px] space-y-1">
                           <p className="text-[12px] font-bold text-apple-near-black/40 dark:text-white/40 uppercase tracking-widest">Point of Contact</p>
                           <p className="text-[19px] font-bold text-apple-near-black dark:text-white">{application.recruiter_name}</p>
                         </div>
                       )}
                       {application.recruiter_email && (
                         <div className="flex-1 min-w-[200px] space-y-1">
                           <p className="text-[12px] font-bold text-apple-near-black/40 dark:text-white/40 uppercase tracking-widest">Email Address</p>
                           <a href={`mailto:${application.recruiter_email}`} className="text-[19px] font-bold text-apple-blue hover:underline">{application.recruiter_email}</a>
                         </div>
                       )}
                       {application.recruiter_phone && (
                         <div className="flex-1 min-w-[200px] space-y-1">
                           <p className="text-[12px] font-bold text-apple-near-black/40 dark:text-white/40 uppercase tracking-widest">Direct Phone</p>
                           <p className="text-[19px] font-bold text-apple-near-black dark:text-white">{application.recruiter_phone}</p>
                         </div>
                       )}
                     </div>
                  </section>
                )}

                {/* Notes Section */}
                {application.notes && (
                  <section className="space-y-8">
                    <h3 className="text-[13px] font-bold text-apple-blue uppercase tracking-[0.2em] border-b border-black/5 dark:border-white/5 pb-4">Reflections</h3>
                    <div className="text-[21px] leading-relaxed text-apple-near-black/80 dark:text-white/80 font-medium tracking-apple-tight italic border-l-4 border-apple-blue/20 pl-8">
                      {application.notes}
                    </div>
                  </section>
                )}

                {/* Interview Section - Timeline Pattern */}
                <section className="space-y-12">
                   <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-4">
                     <h3 className="text-[13px] font-bold text-apple-blue uppercase tracking-[0.2em]">Interview History</h3>
                     <button
                        onClick={() => setShowAddNote(!showAddNote)}
                        className="text-apple-blue font-bold text-[14px] hover:text-apple-blue/80 flex items-center gap-1.5 transition-all"
                      >
                        <Plus size={16} />
                        Add Record
                      </button>
                   </div>

                   {/* Add Note Form - Animated In-place */}
                   <AnimatePresence>
                      {showAddNote && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="apple-card p-8 bg-apple-gray dark:bg-zinc-900 border-none space-y-8"
                        >
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-2">
                                <label className="text-[13px] font-bold text-apple-near-black dark:text-white uppercase tracking-wider ml-1">Round Name</label>
                                <input
                                  type="text"
                                  value={newNote.round_name}
                                  onChange={(e) => setNewNote({ ...newNote, round_name: e.target.value })}
                                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-apple-near-black border-none focus:ring-2 focus:ring-apple-blue/20 transition-all font-medium"
                                  placeholder="e.g. Technical Screen 1"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[13px] font-bold text-apple-near-black dark:text-white uppercase tracking-wider ml-1">Method</label>
                                <select
                                  value={newNote.interview_type}
                                  onChange={(e) => setNewNote({ ...newNote, interview_type: e.target.value as any })}
                                  className="w-full px-4 py-3 rounded-xl bg-white dark:bg-apple-near-black border-none focus:ring-2 focus:ring-apple-blue/20 transition-all font-medium"
                                >
                                  {['Phone', 'Video', 'In-person', 'Technical', 'Behavioral', 'Panel', 'Group', 'Case Study'].map(type => (
                                    <option key={type} value={type}>{type}</option>
                                  ))}
                                </select>
                              </div>
                           </div>

                           <div className="space-y-2">
                              <label className="text-[13px] font-bold text-apple-near-black dark:text-white uppercase tracking-wider ml-1">Questions Asked</label>
                              <textarea
                                value={newNote.questions_asked}
                                onChange={(e) => setNewNote({ ...newNote, questions_asked: e.target.value })}
                                className="w-full px-5 py-4 rounded-2xl bg-white dark:bg-apple-near-black border-none focus:ring-2 focus:ring-apple-blue/20 transition-all min-h-[120px]"
                                placeholder="What challenges were presented?"
                              />
                           </div>

                           <div className="flex items-center justify-end gap-4">
                              <button onClick={() => setShowAddNote(false)} className="text-[15px] font-bold text-apple-near-black/40">Cancel</button>
                              <button onClick={handleAddNote} className="apple-pill-filled px-8">Save Record</button>
                           </div>
                        </motion.div>
                      )}
                   </AnimatePresence>

                   {/* History Timeline */}
                   <div className="space-y-8">
                      {interviewNotes.length === 0 && !showAddNote ? (
                        <div className="text-center py-20 border-2 border-dashed border-black/5 dark:border-white/5 rounded-[40px]">
                           <MessageSquare className="w-16 h-16 mx-auto mb-4 text-apple-near-black/10" />
                           <p className="text-[19px] font-medium text-apple-near-black/40 dark:text-white/40 tracking-apple-tight">No interview records documented yet.</p>
                        </div>
                      ) : (
                        interviewNotes.map((note) => (
                          <motion.div
                            key={note.id}
                            className="relative pl-12 before:absolute before:left-0 before:top-4 before:bottom-0 before:w-[2px] before:bg-apple-blue/10 last:before:hidden"
                          >
                             {/* Timeline Node */}
                             <div className="absolute left-[-5px] top-3 w-[12px] h-[12px] rounded-full bg-apple-blue shadow-[0_0_15px_rgba(0,113,227,0.5)]" />
                             
                             <div className="apple-card bg-apple-gray dark:bg-zinc-900 border-none p-10 group hover:shadow-apple transition-all duration-500">
                                <div className="flex items-start justify-between mb-8">
                                   <div>
                                      <h4 className="text-[24px] font-bold text-apple-near-black dark:text-white tracking-apple-tight mb-2">
                                        Round {note.round_number}: {note.round_name}
                                      </h4>
                                      <div className="flex items-center gap-6">
                                        <span className="text-[14px] font-bold text-apple-near-black/30 dark:text-white/30 uppercase tracking-[0.15em]">{note.interview_type}</span>
                                        {note.outcome && (
                                          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white dark:bg-apple-near-black shadow-sm">
                                            {outcomeIcons[note.outcome]}
                                            <span className="text-[13px] font-bold tracking-apple-tight">{note.outcome}</span>
                                          </div>
                                        )}
                                      </div>
                                   </div>
                                   <button
                                      onClick={() => onDeleteNote(note.id)}
                                      className="w-10 h-10 rounded-full bg-white dark:bg-apple-near-black flex items-center justify-center text-apple-near-black/10 hover:text-red-500 transition-colors"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                   {note.questions_asked && (
                                     <div className="space-y-3">
                                        <p className="text-[13px] font-bold text-apple-blue uppercase tracking-widest">Questions</p>
                                        <p className="text-[17px] font-medium text-apple-near-black/80 dark:text-white/80 leading-relaxed whitespace-pre-wrap">{note.questions_asked}</p>
                                     </div>
                                   )}
                                   {note.key_takeaways && (
                                     <div className="space-y-3">
                                        <p className="text-[13px] font-bold text-apple-blue uppercase tracking-widest">Takeaways</p>
                                        <p className="text-[17px] font-medium text-apple-near-black/80 dark:text-white/80 leading-relaxed whitespace-pre-wrap">{note.key_takeaways}</p>
                                     </div>
                                   )}
                                </div>
                             </div>
                          </motion.div>
                        ))
                      )}
                   </div>
                </section>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
