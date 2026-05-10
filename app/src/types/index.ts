export type ApplicationStatus = 
  | 'Applied' 
  | 'Phone Screen' 
  | 'Interview' 
  | 'Technical' 
  | 'Offer' 
  | 'Rejected' 
  | 'Withdrawn' 
  | 'Ghosted';

export type EmploymentType = 
  | 'Full-time' 
  | 'Part-time' 
  | 'Contract' 
  | 'Internship' 
  | 'Freelance';

export type InterviewType = 
  | 'Phone' 
  | 'Video' 
  | 'In-person' 
  | 'Technical' 
  | 'Behavioral' 
  | 'Panel' 
  | 'Group' 
  | 'Case Study';

export type InterviewOutcome = 
  | 'Pending' 
  | 'Passed' 
  | 'Failed' 
  | 'No-show' 
  | 'Rescheduled';

export type ReminderType = 
  | 'Deadline' 
  | 'Interview' 
  | 'Follow-up' 
  | 'Custom';

export type DocumentType = 
  | 'Resume' 
  | 'Cover Letter' 
  | 'Transcript' 
  | 'Portfolio' 
  | 'Certificate' 
  | 'Other';

export type UserRole = 'student' | 'admin';

export interface Application {
  id: string;
  user_id: string;
  company_name: string;
  job_title: string;
  job_description?: string;
  job_url?: string;
  location?: string;
  salary_range?: string;
  employment_type?: EmploymentType;
  status: ApplicationStatus;
  applied_date: string;
  deadline_date?: string;
  interview_date?: string;
  recruiter_name?: string;
  recruiter_email?: string;
  recruiter_phone?: string;
  resume_url?: string;
  cover_letter_url?: string;
  notes?: string;
  rating?: number;
  created_at: string;
  updated_at: string;
}

export interface InterviewNote {
  id: string;
  application_id: string;
  user_id: string;
  round_number: number;
  round_name: string;
  interview_type?: InterviewType;
  scheduled_date?: string;
  duration_minutes?: number;
  questions_asked?: string;
  answers_given?: string;
  key_takeaways?: string;
  follow_up_items?: string;
  outcome?: InterviewOutcome;
  interviewer_name?: string;
  interviewer_role?: string;
  interviewer_email?: string;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  application_id?: string;
  title: string;
  description?: string;
  reminder_date: string;
  reminder_type: ReminderType;
  is_completed: boolean;
  is_notified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  user_id: string;
  application_id?: string;
  name: string;
  document_type: DocumentType;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  is_default: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name?: string;
  avatar_url?: string;
  university?: string;
  major?: string;
  graduation_year?: number;
  role: UserRole;
  login_count: number;
  last_login_at?: string;
  preferences?: UserPreferences;
  welcome_email_sent?: boolean;
  dob?: string;
  merit?: string;
  additional_data?: string;
  signup_date?: string;
  total_minutes_spent?: number;
  today_minutes_spent?: number;
  last_active_date?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  emailNotifications?: boolean;
  deadlineReminders?: boolean;
  interviewReminders?: boolean;
  weeklyDigest?: boolean;
  theme?: string;
  glassEffect?: string;
  animations?: boolean;
}

export interface ApplicationStats {
  total_applications: number;
  applied_count: number;
  interview_count: number;
  offer_count: number;
  rejected_count: number;
  pending_count: number;
}

export interface StatusCount {
  status: ApplicationStatus;
  count: number;
}

export interface MonthlyApplication {
  month: string;
  count: number;
}

// ============================================
// Admin-specific types
// ============================================

export interface AdminStats {
  totalUsers: number;
  totalApplications: number;
  activeUsersLast7Days: number;
  offerRate: number;
}

export interface UserActivity {
  user_id: string;
  full_name: string;
  email: string;
  university?: string;
  major?: string;
  role: UserRole;
  login_count: number;
  last_login_at?: string;
  joined_at: string;
  application_count: number;
  welcome_email_sent: boolean;
  avatar_url?: string;
  graduation_year?: number;
  dob?: string;
  merit?: string;
  additional_data?: string;
  signup_date?: string;
}

export interface CompanyStats {
  company_name: string;
  student_count: number;
  application_count: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

export interface PipelineStage {
  stage: string;
  stage_order: number;
  count: number;
}

export interface AdminRecentApplication {
  id: string;
  company_name: string;
  job_title: string;
  status: string;
  applied_date: string;
  created_at: string;
  applicant_name: string;
  applicant_email: string;
}
