import { useState, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { InlineLoader } from '@/components/shared/PremiumLoader';
import { Logo } from '@/components/shared/Logo';

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
      setError(err.message || 'An error occurred');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[400px] mx-auto p-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      >
          {/* Logo Header */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-10">
              <Logo size="lg" />
            </div>
            <h1 className="text-[34px] font-semibold tracking-tight text-zinc-900 dark:text-white mb-2">
              {isLogin ? 'Welcome back' : 'Get started'}
            </h1>
            <p className="text-[16px] text-zinc-500 dark:text-zinc-400 font-medium tracking-tight">
              {isLogin ? 'Sign in to your account to continue.' : 'Create an account to track your journey.'}
            </p>
          </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-zinc-950 border border-black/5 dark:border-white/10 rounded-[32px] overflow-hidden shadow-2xl shadow-black/5">
          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? 'login' : 'register'}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit}
              className="p-8 space-y-6"
            >
              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-apple-blue/30 transition-all placeholder:text-zinc-400"
                    placeholder="John Appleseed"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[12px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-apple-blue/30 transition-all placeholder:text-zinc-400"
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest ml-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-apple-blue/30 transition-all placeholder:text-zinc-400"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm font-medium text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={combinedLoading}
                className="w-full py-4 rounded-xl bg-apple-blue text-white font-bold shadow-lg shadow-apple-blue/20 hover:shadow-xl hover:shadow-apple-blue/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {combinedLoading ? (
                  <InlineLoader size={20} color="bg-white" />
                ) : (
                  <>
                    <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </motion.form>
          </AnimatePresence>
        </div>

        {/* Footer Toggle */}
        <div className="mt-10 text-center flex flex-col items-center gap-3">
          <span className="text-[16px] text-apple-near-black/50 dark:text-white/40 font-medium">
            {isLogin ? "Don't have an account yet?" : 'Already have an account?'}
          </span>
          <button
            onClick={toggleMode}
            className="text-[20px] font-black text-apple-blue hover:opacity-80 transition-opacity"
          >
            {isLogin ? 'Sign up for free' : 'Sign in instead'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
