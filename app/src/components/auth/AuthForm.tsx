import { useState, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ShieldHalf, Send } from 'lucide-react';
import { InlineLoader } from '@/components/shared/PremiumLoader';
import { Logo } from '@/components/shared/Logo';
import { submitAppeal } from '@/lib/supabase';
import { toast } from 'sonner';

interface AuthFormProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string, fullName: string) => Promise<void>;
  loading: boolean;
}

export function AuthForm({ onLogin, onRegister, loading }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealMessage, setAppealMessage] = useState('');
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);
  const combinedLoading = loading || formLoading;

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.toLowerCase();
      if (hash === '#signup') setIsLogin(false);
      if (hash === '#login') setIsLogin(true);
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const toggleMode = () => {
    const newIsLogin = !isLogin;
    setIsLogin(newIsLogin);
    window.location.hash = newIsLogin ? 'login' : 'signup';
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setFormLoading(true);
    try {
      if (isLogin) {
        await onLogin(email, password);
      } else {
        if (!fullName.trim()) {
          setError('Please enter your full name');
          return;
        }
        await onRegister(email, password, fullName);
      }
    } catch (err: any) {
      if (err.message.includes("ACCOUNT LOCKED") || err.message === "ACCOUNT_LOCKED") {
        setError("SECURITY ALERT: This account has been locked by an administrator.");
        setShowAppealModal(true);
      } else {
        setError(err.message || 'An error occurred');
      }
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-white dark:bg-zinc-950 bg-grid-pattern relative flex items-center justify-center p-4 overflow-hidden">
      {/* Decorative top gradient */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#0071E3]/[0.02] to-transparent pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-[480px] relative z-10 flex flex-col items-center"
      >
          {/* Logo Header */}
          <div className="text-center mb-4 flex flex-col items-center w-full">
            <div className="flex justify-center mb-4">
              <Logo size="lg" />
            </div>
            <h1 className="text-[48px] md:text-[64px] font-semibold tracking-tighter leading-none text-zinc-900 dark:text-white mb-1">
              {isLogin ? 'Welcome back.' : 'Join the Track.'}
            </h1>
            <p className="text-[17px] text-zinc-400 dark:text-zinc-500 font-medium tracking-tight max-w-[360px] mx-auto">
              {isLogin ? 'Sign in to access your dashboard.' : 'Start your career journey today.'}
            </p>
          </div>

        {/* Form Card */}
        <div className="w-full bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-[32px] overflow-hidden shadow-[0_24px_48px_-12px_rgba(0,0,0,0.08)]">
          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? 'login' : 'register'}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit}
              className="p-7 space-y-4"
            >
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-5 py-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30 transition-all placeholder:text-zinc-400 text-[15px]"
                    placeholder="Enter your name"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30 transition-all placeholder:text-zinc-400 text-[15px]"
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[11px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
                    Password
                  </label>
                  {isLogin && (
                    <button type="button" className="text-[11px] font-bold text-[#0071E3] hover:underline">
                      Forgot?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/5 focus:outline-none focus:ring-2 focus:ring-[#0071E3]/30 transition-all placeholder:text-zinc-400 text-[15px]"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <p className="text-red-500 text-[13px] font-semibold text-center bg-red-50 dark:bg-red-500/10 py-2 rounded-lg border border-red-100 dark:border-red-500/20">{error}</p>
              )}

              <button
                type="submit"
                disabled={combinedLoading}
                className="w-full py-4 rounded-2xl bg-[#0071E3] text-white font-semibold shadow-xl shadow-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-[16px] tracking-tight"
              >
                {combinedLoading ? (
                  <InlineLoader size={22} color="bg-white" />
                ) : (
                  <>
                    <span>{isLogin ? 'Sign In to Dashboard' : 'Create Account'}</span>
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </motion.form>
          </AnimatePresence>
        </div>

        {/* Footer Toggle */}
        <div className="mt-8 text-center flex flex-col items-center gap-3">
          <span className="text-[16px] text-zinc-400 dark:text-white/40 font-medium">
            {isLogin ? "New to the platform?" : 'Already have an account?'}
          </span>
          <button
            onClick={toggleMode}
            className="group flex items-center gap-2 text-[18px] font-semibold text-zinc-900 dark:text-white hover:text-[#0071E3] dark:hover:text-[#0071E3] transition-colors"
          >
            {isLogin ? 'Create an account' : 'Sign in to your account'}
            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showAppealModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowAppealModal(false)} 
              className="absolute inset-0 bg-black/60 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }} 
              className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[32px] p-10 shadow-2xl overflow-hidden border border-red-500/10"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-6">
                  <ShieldHalf size={32} />
                </div>
                <h3 className="text-2xl font-bold dark:text-white mb-2">Account Restricted</h3>
                <p className="text-[14px] text-zinc-500 dark:text-zinc-400 font-medium mb-8">
                  Your access to InternTrack has been suspended by the Security Team. If you believe this is an error, please submit an appeal below.
                </p>
                
                <textarea
                  value={appealMessage}
                  onChange={(e) => setAppealMessage(e.target.value)}
                  placeholder="Describe your situation and why access should be restored..."
                  className="w-full px-5 py-4 rounded-2xl bg-black/5 dark:bg-white/5 border-none text-[14px] focus:ring-2 focus:ring-red-500/20 mb-6 min-h-[120px] resize-none font-medium"
                />

                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setShowAppealModal(false)}
                    className="flex-1 py-4 rounded-2xl bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 font-bold text-[15px] hover:bg-black/10 transition-all"
                  >
                    Close
                  </button>
                  <button
                    onClick={async () => {
                      if (!appealMessage.trim()) return;
                      setIsSubmittingAppeal(true);
                      const success = await submitAppeal('LOCKED_USER', email, 'Locked User', appealMessage);
                      if (success) {
                        toast.success("Security Appeal Transmitted", {
                          description: "The administration will review your request shortly."
                        });
                        setShowAppealModal(false);
                        setAppealMessage('');
                      } else {
                        toast.error("Transmission Failed");
                      }
                      setIsSubmittingAppeal(false);
                    }}
                    disabled={isSubmittingAppeal || !appealMessage.trim()}
                    className="flex-[2] py-4 rounded-2xl bg-red-500 text-white font-bold text-[15px] flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 hover:bg-red-600 transition-all disabled:opacity-50"
                  >
                    {isSubmittingAppeal ? (
                      <InlineLoader size={20} color="bg-white" />
                    ) : (
                      <>
                        <Send size={18} />
                        Submit Appeal
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
