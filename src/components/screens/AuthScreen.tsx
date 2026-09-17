import React, { useState } from 'react';
import { Logo } from '../common/Logo';
import { Mail, Lock, User as UserIcon, Phone, ArrowRight, Store, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { UserRole } from '../../types';
import { authService } from '../../services/authService';

interface AuthScreenProps {
  onLoginSuccess: (role: UserRole, userDetails?: { name: string; email: string }) => void;
  onContinueAsGuest: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onLoginSuccess,
  onContinueAsGuest,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [role, setRole] = useState<UserRole>('user');

  // Form states
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const email = identifier.trim();
    if (!email) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setErrorMessage('Full Name is required.');
        return;
      }
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please verify.');
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const profile = await authService.signUp({
          name: name.trim(),
          email,
          password,
          role,
          phone: phone.trim()
        });
        onLoginSuccess(profile.role, {
          name: profile.name,
          email: profile.email
        });
      } else {
        const profile = await authService.login(email, password);
        onLoginSuccess(profile.role, {
          name: profile.name,
          email: profile.email
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setLoading(true);
    try {
      const profile = await authService.loginWithGoogle(role);
      onLoginSuccess(profile.role, {
        name: profile.name,
        email: profile.email
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="flex-1 min-h-0 flex flex-col p-6 bg-gradient-to-b from-[#FFFDF7] via-[#FFFBF2] to-[#FAF7F2] overflow-y-auto">
      {/* Top Logo */}
      <div className="pt-2 pb-5 flex items-center justify-between">
        <Logo size="sm" showTagline={false} />
        <button
          onClick={onContinueAsGuest}
          className="text-xs font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-full border border-orange-200/60 transition-colors"
        >
          Continue as Guest
        </button>
      </div>

      {/* Role Selection Tabs (User vs Shopkeeper) */}
      <div className="mb-5 bg-amber-100/50 p-1 rounded-2xl flex items-center gap-1 border border-amber-200/60">
        <button
          type="button"
          onClick={() => setRole('user')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            role === 'user'
              ? 'bg-white text-amber-950 shadow-xs border border-amber-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserIcon size={14} />
          <span>👤 User Mode</span>
        </button>
        <button
          type="button"
          onClick={() => setRole('shopkeeper')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            role === 'shopkeeper'
              ? 'bg-white text-amber-950 shadow-xs border border-amber-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Store size={14} />
          <span>🏪 Shopkeeper</span>
        </button>
      </div>

      {/* Heading */}
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          {mode === 'login'
            ? role === 'shopkeeper'
              ? 'Shopkeeper Portal'
              : 'Welcome Back'
            : role === 'shopkeeper'
            ? 'Register Shop'
            : 'Create Account'}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {mode === 'login'
            ? role === 'shopkeeper'
              ? 'Manage your stall, update live menu, and track reviews.'
              : 'Check food safety and explore verified nearby street food.'
            : 'Join the community eating smarter and safer every day.'}
        </p>
      </div>

      {/* Error Message Alert */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2 text-xs">
          <AlertCircle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-700 text-xs font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {mode === 'signup' && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              {role === 'shopkeeper' ? 'Shopkeeper / Stall Name' : 'Full Name'}
            </label>
            <div className="relative">
              <UserIcon size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'shopkeeper' ? 'e.g. Ramesh (Shree Snacks)' : 'e.g. Harshal Lad'}
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
                required
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Email / Mobile Number
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. user@foodcheck.com"
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
              required
            />
          </div>
        </div>

        {mode === 'signup' && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Mobile Number
            </label>
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98200 12345"
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
              />
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-semibold text-slate-600">Password</label>
            {mode === 'login' && (
              <button
                type="button"
                className="text-[11px] font-medium text-orange-600 hover:underline"
              >
                Forgot Password?
              </button>
            )}
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
              required
            />
          </div>
        </div>

        {mode === 'signup' && (
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15"
                required
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>{mode === 'login' ? 'Signing in…' : 'Creating account…'}</span>
            </>
          ) : (
            <>
              <span>{mode === 'login' ? 'Login' : 'Create Account'}</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>

        {/* Google Auth */}
        <div className="relative my-2 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <span className="relative bg-[#FFFBF2] px-3 text-[11px] text-slate-400 font-medium uppercase tracking-wider">
            Or
          </span>
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={handleGoogleSignIn}
          className="w-full py-2.5 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-70"
        >
          {/* Google G SVG */}
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.29 21.36 7.37 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.37 0 3.29 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        {/* Toggle Login / Signup */}
        <div className="mt-2 text-center">
          <button
            type="button"
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-xs text-slate-500 font-medium"
          >
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <span className="text-orange-600 font-bold hover:underline">Sign Up</span>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <span className="text-orange-600 font-bold hover:underline">Login</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Safety Badge Footer */}
      <div className="mt-auto pt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-medium">
        <Shield size={13} className="text-orange-500" />
        <span>FSSAI Aware & AI-Powered Food Verification</span>
      </div>
    </div>
  );
};
