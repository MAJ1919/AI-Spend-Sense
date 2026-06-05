import React, { useState } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { Wallet, LogIn, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function LoginModal() {
  const { user, login, register, loading } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const { t } = useTranslation();

  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!username.trim() || !password.trim()) {
      setFormError('Username and password are required');
      return;
    }

    const result = isRegistering 
      ? await register(username.trim(), password)
      : await login(username.trim(), password);

    if (!result.success) {
      setFormError(result.error || 'Authentication failed');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border-light max-w-md w-full rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-card border border-border-light flex items-center justify-center text-accent-teal glow-teal-md mb-4">
            <Wallet className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            {isRegistering ? 'Create Account' : t('login.title', 'Welcome to SpendSense AI')}
          </h2>
          <p className="text-slate-400 mt-2 text-center text-sm">
            {isRegistering 
              ? 'Enter a username and password to create a secure account.' 
              : 'Enter your credentials to access your dashboard.'}
          </p>
        </div>

        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-slate-300">
              {t('login.username', 'Username')}
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-background border border-border-light rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-teal/50 transition-all placeholder:text-slate-500"
              placeholder={t('login.placeholder', 'e.g., ahmed')}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-border-light rounded-xl px-4 py-3 text-slate-100 focus:outline-none focus:ring-2 focus:ring-accent-teal/50 transition-all placeholder:text-slate-500"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent-teal hover:bg-accent-teal/90 text-slate-900 font-semibold rounded-xl px-4 py-3 flex items-center justify-center gap-2 transition-all glow-teal-sm hover:glow-teal-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : (isRegistering ? 'Sign Up' : t('login.button', 'Continue'))}
            {isRegistering ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          {isRegistering ? 'Already have an account?' : 'Need an account?'}
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setFormError(null);
            }}
            className="ml-1 text-accent-teal hover:underline focus:outline-none font-medium"
          >
            {isRegistering ? 'Log in' : 'Create one'}
          </button>
        </div>
      </div>
    </div>
  );
}
