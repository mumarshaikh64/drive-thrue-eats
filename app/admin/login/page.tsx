'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, ArrowRight, ShieldCheck, KeyRound, CheckCircle2, ArrowLeft, Eye, EyeOff } from 'lucide-react';

type View = 'login' | 'reset-email' | 'reset-password' | 'reset-success';

export default function AdminLoginPage() {
  const router = useRouter();

  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset states
  const [view, setView] = useState<View>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  const [mainSiteUrl, setMainSiteUrl] = useState('/');

  useEffect(() => {
    const isSub = window.location.hostname.startsWith('admin.');
    if (isSub) {
      setMainSiteUrl(window.location.origin.replace('admin.', ''));
    }

    const verifySession = async () => {
      try {
        const res = await fetch('/api/auth/session', { cache: 'no-store' });
        if (res.ok) {
          router.replace(isSub ? '/' : '/admin');
        }
      } catch {
        // stay on login
      }
    };
    verifySession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        const isSub = window.location.hostname.startsWith('admin.');
        router.replace(isSub ? '/' : '/admin');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1 — verify email
  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail }),
      });
      const data = await res.json();
      if (data.success) {
        setView('reset-password');
      } else {
        setResetError(data.error || 'Email not found.');
      }
    } catch {
      setResetError('Network error. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  // Step 2 — update password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }
    setResetLoading(true);
    setResetError('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setView('reset-success');
      } else {
        setResetError(data.error || 'Failed to update password.');
      }
    } catch {
      setResetError('Network error. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const goBackToLogin = () => {
    setView('login');
    setResetEmail('');
    setNewPassword('');
    setConfirmPassword('');
    setResetError('');
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-brand-red/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-orange/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="max-w-md w-full relative z-10">
        <div className="glass rounded-[2.5rem] shadow-premium overflow-hidden border-white">

          {/* ───── HEADER ───── */}
          <div className="bg-brand-red p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-8 -mb-8 blur-xl" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
                {view === 'reset-success' ? (
                  <CheckCircle2 size={32} className="text-white" />
                ) : view === 'login' ? (
                  <ShieldCheck size={32} className="text-white" />
                ) : (
                  <KeyRound size={32} className="text-white" />
                )}
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tighter">
                {view === 'login' && 'Admin Portal'}
                {view === 'reset-email' && 'Reset Password'}
                {view === 'reset-password' && 'New Password'}
                {view === 'reset-success' && 'All Done!'}
              </h1>
              <p className="text-red-100 text-xs mt-1 font-bold uppercase tracking-[0.3em]">
                {view === 'login' && 'Secure Access Only'}
                {view === 'reset-email' && 'Step 1 of 2 — Verify Email'}
                {view === 'reset-password' && 'Step 2 of 2 — Set New Password'}
                {view === 'reset-success' && 'Password Updated Successfully'}
              </p>
            </div>
          </div>

          {/* ───── LOGIN FORM ───── */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="p-10 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold px-4 py-3 rounded-xl text-center uppercase tracking-wider">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.2em] ml-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-red" size={18} />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-brand-border rounded-2xl focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red outline-none font-bold text-sm transition-all"
                    placeholder="admin@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.2em] ml-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-red" size={18} />
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-gray-50/50 border border-brand-border rounded-2xl focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red outline-none font-bold text-sm transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-red transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Forgot Password link */}
              <div className="text-right -mt-2">
                <button
                  type="button"
                  onClick={() => { setView('reset-email'); setResetError(''); }}
                  className="text-[10px] font-bold text-brand-muted hover:text-brand-red uppercase tracking-wider transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                disabled={loading}
                type="submit"
                className="w-full bg-brand-red hover:bg-red-700 text-white font-bold py-5 rounded-2xl transition-all shadow-premium active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {loading ? (
                  <span className="animate-pulse">AUTHENTICATING...</span>
                ) : (
                  <>ACCESS DASHBOARD <ArrowRight size={18} /></>
                )}
              </button>
            </form>
          )}

          {/* ───── STEP 1: VERIFY EMAIL ───── */}
          {view === 'reset-email' && (
            <form onSubmit={handleVerifyEmail} className="p-10 space-y-6">
              <p className="text-xs text-brand-muted font-medium text-center leading-relaxed">
                Enter your admin email address to verify your account before setting a new password.
              </p>

              {resetError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold px-4 py-3 rounded-xl text-center uppercase tracking-wider">
                  {resetError}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.2em] ml-2">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-red" size={18} />
                  <input
                    required
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-brand-border rounded-2xl focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red outline-none font-bold text-sm transition-all"
                    placeholder="admin@example.com"
                  />
                </div>
              </div>

              <button
                disabled={resetLoading}
                type="submit"
                className="w-full bg-brand-red hover:bg-red-700 text-white font-bold py-5 rounded-2xl transition-all shadow-premium active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {resetLoading ? <span className="animate-pulse">VERIFYING...</span> : <>VERIFY EMAIL <ArrowRight size={18} /></>}
              </button>

              <button type="button" onClick={goBackToLogin} className="w-full flex items-center justify-center gap-2 text-[10px] font-bold text-brand-muted hover:text-brand-red uppercase tracking-widest transition-colors">
                <ArrowLeft size={14} /> Back to Login
              </button>
            </form>
          )}

          {/* ───── STEP 2: SET NEW PASSWORD ───── */}
          {view === 'reset-password' && (
            <form onSubmit={handleResetPassword} className="p-10 space-y-6">
              <div className="bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-4 py-3 rounded-xl text-center uppercase tracking-wider">
                ✓ Email verified: {resetEmail}
              </div>

              {resetError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold px-4 py-3 rounded-xl text-center uppercase tracking-wider">
                  {resetError}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.2em] ml-2">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-red" size={18} />
                  <input
                    required
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-gray-50/50 border border-brand-border rounded-2xl focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red outline-none font-bold text-sm transition-all"
                    placeholder="Min. 6 characters"
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-red transition-colors">
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.2em] ml-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-red" size={18} />
                  <input
                    required
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-gray-50/50 border border-brand-border rounded-2xl focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red outline-none font-bold text-sm transition-all"
                    placeholder="Re-enter new password"
                  />
                </div>
              </div>

              <button
                disabled={resetLoading}
                type="submit"
                className="w-full bg-brand-red hover:bg-red-700 text-white font-bold py-5 rounded-2xl transition-all shadow-premium active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {resetLoading ? <span className="animate-pulse">UPDATING...</span> : <>UPDATE PASSWORD <ArrowRight size={18} /></>}
              </button>

              <button type="button" onClick={goBackToLogin} className="w-full flex items-center justify-center gap-2 text-[10px] font-bold text-brand-muted hover:text-brand-red uppercase tracking-widest transition-colors">
                <ArrowLeft size={14} /> Back to Login
              </button>
            </form>
          )}

          {/* ───── SUCCESS ───── */}
          {view === 'reset-success' && (
            <div className="p-10 space-y-6 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={40} className="text-green-500" />
              </div>
              <div>
                <p className="font-bold text-brand-text text-lg tracking-tight">Password Updated!</p>
                <p className="text-sm text-brand-muted mt-2 leading-relaxed">
                  Your admin password has been successfully changed. You can now log in with your new password.
                </p>
              </div>
              <button
                onClick={goBackToLogin}
                className="w-full bg-brand-red hover:bg-red-700 text-white font-bold py-5 rounded-2xl transition-all shadow-premium active:scale-[0.98] flex items-center justify-center gap-2"
              >
                GO TO LOGIN <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="px-10 pb-8 text-center">
            <a
              href={mainSiteUrl}
              className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.2em] hover:text-brand-red transition-colors"
            >
              ← Back to Website
            </a>
          </div>
        </div>

        <p className="text-center text-[10px] text-brand-muted font-bold uppercase tracking-[0.3em] mt-6">
          Drive Thru Eats — Admin Authentication
        </p>
      </div>
    </div>
  );
}
