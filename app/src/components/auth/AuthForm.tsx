import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, ArrowRight, Loader2 } from 'lucide-react';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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
      setError(err.message || 'An error occurred');
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  return (
    <div className="w-full max-w-[400px] mx-auto p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Logo & Header */}
        <div className="text-center mb-10">
          <motion.div 
            className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-apple-blue shadow-lg shadow-apple-blue/40 mb-6 text-white"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <Briefcase size={24} />
          </motion.div>
          <h1 className="text-[32px] font-bold tracking-apple-tight text-apple-near-black dark:text-white mb-2">
            {isLogin ? 'Sign In.' : 'Create an Account.'}
          </h1>
          <p className="text-[17px] text-apple-near-black/70 dark:text-white/70 tracking-apple-tight">
            {isLogin ? 'Welcome back to your professional console.' : 'Start tracking your career journey today.'}
          </p>
        </div>

        {/* Form Card */}
        <div className="apple-card p-1 bg-white dark:bg-apple-near-black ring-1 ring-black/5 dark:ring-white/5 shadow-apple overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? 'login' : 'register'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              onSubmit={handleSubmit}
              className="p-8 space-y-6"
            >
              {/* Full Name */}
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-[13px] font-bold text-apple-near-black/60 dark:text-white/60 uppercase tracking-widest ml-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-apple-gray dark:bg-zinc-900 text-apple-near-black dark:text-white border-none focus:ring-2 focus:ring-apple-blue/20 transition-all"
                    placeholder="John Appleseed"
                  />
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-apple-near-black/60 dark:text-white/60 uppercase tracking-widest ml-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-apple-gray dark:bg-zinc-900 text-apple-near-black dark:text-white border-none focus:ring-2 focus:ring-apple-blue/20 transition-all"
                  placeholder="name@example.com"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-[13px] font-bold text-apple-near-black/60 dark:text-white/60 uppercase tracking-widest ml-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-apple-gray dark:bg-zinc-900 text-apple-near-black dark:text-white border-none focus:ring-2 focus:ring-apple-blue/20 transition-all"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 rounded-lg bg-red-500/10 text-red-500 text-xs font-semibold text-center"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="apple-pill-filled w-full flex items-center justify-center gap-2 group"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>{isLogin ? 'Sign In' : 'Register'}</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </motion.form>
          </AnimatePresence>
        </div>

        {/* Toggle Mode */}
        <div className="mt-8 text-center flex flex-col items-center gap-2">
          <span className="text-[15px] text-apple-near-black/70 dark:text-white/70">
            {isLogin ? "Don't have an account yet?" : "Already have an account?"}
          </span>
          <button
            onClick={toggleMode}
            className="text-[16px] font-bold text-apple-blue hover:text-apple-blue/80 transition-colors px-4 py-2 rounded-full hover:bg-apple-blue/5"
          >
            {isLogin ? 'Sign up for free' : 'Sign in instead'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
