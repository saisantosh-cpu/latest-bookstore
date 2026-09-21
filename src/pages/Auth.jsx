import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isFirebaseConfigured } from '../firebase/config';
import { Lock, Mail, User, ArrowRight, KeyRound, CheckCircle2, Eye, EyeOff } from 'lucide-react';

const Auth = () => {
  // 'login' | 'signup' | 'forgot'
  const [view, setView] = useState('login');
  const [email, setEmail] = useState(isFirebaseConfigured ? '' : 'user@example.com');
  const [password, setPassword] = useState(isFirebaseConfigured ? '' : 'password123');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login, signup, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (view === 'login') {
      const result = await login(email, password);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.error);
      }
    } else if (view === 'signup') {
      const result = await signup(email, password, name);
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.error);
      }
    } else if (view === 'forgot') {
      const result = await resetPassword(email);
      if (result.success) {
        setResetSent(true);
      } else {
        setError(result.error);
      }
    }

    setSubmitting(false);
  };

  const handleFillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setView('login');
    setError('');
  };

  const switchView = (nextView) => {
    setView(nextView);
    setError('');
    setResetSent(false);
  };

  const titles = {
    login: { h1: 'Sign in to your library', sub: 'Access your saved reading lists, recent orders, and curated shelf.' },
    signup: { h1: 'Create reader account', sub: 'Join our community of passionate bibliophiles and collectors.' },
    forgot: { h1: 'Reset your password', sub: "Enter your email and we'll send you a link to set a new password." },
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-[#FAF7F2] dark:bg-[#0D0D11] transition-colors duration-200">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group">
            <span className="w-10 h-10 rounded-sm bg-[#1A1A20] dark:bg-[#E8E4DC] text-[#FAF7F2] dark:text-[#1A1A20] flex items-center justify-center font-serif font-bold text-xl transition-transform group-hover:scale-105">
              N
            </span>
            <span className="font-serif text-2xl tracking-tight text-[#1A1A20] dark:text-[#E8E4DC] font-semibold">
              Nova<span className="italic font-normal text-[#C45525] dark:text-[#E07A4F]">Books</span>
            </span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-serif text-[#1A1A20] dark:text-[#E8E4DC] font-normal tracking-tight">
            {titles[view].h1}
          </h1>
          <p className="text-xs sm:text-sm text-[#7A766E] dark:text-[#9E9A90] mt-1.5 font-sans">
            {titles[view].sub}
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-[#FFFFFF] dark:bg-[#1A1A20] border border-[#E8E4DC] dark:border-[#2A2A35] rounded-sm p-7 sm:p-9 shadow-sm">

          {view !== 'forgot' && (
            <div className="flex border-b border-[#E8E4DC] dark:border-[#2A2A35] mb-6">
              <button
                type="button"
                onClick={() => switchView('login')}
                className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 ${
                  view === 'login'
                    ? 'border-[#C45525] text-[#C45525] dark:border-[#E07A4F] dark:text-[#E07A4F]'
                    : 'border-transparent text-[#7A766E] dark:text-[#9E9A90] hover:text-[#1A1A20] dark:hover:text-[#E8E4DC]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchView('signup')}
                className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 ${
                  view === 'signup'
                    ? 'border-[#C45525] text-[#C45525] dark:border-[#E07A4F] dark:text-[#E07A4F]'
                    : 'border-transparent text-[#7A766E] dark:text-[#9E9A90] hover:text-[#1A1A20] dark:hover:text-[#E8E4DC]'
                }`}
              >
                New Account
              </button>
            </div>
          )}

          {error && (
            <div className="bg-[#FDF2F0] dark:bg-[#2A1515] border border-[#F5C2B8] dark:border-[#4D2323] text-[#A63A1D] dark:text-[#E27D68] p-3 rounded-sm text-xs mb-6 flex items-start gap-2">
              <span className="font-bold shrink-0">Note:</span>
              <span>{error}</span>
            </div>
          )}

          {view === 'forgot' && resetSent ? (
            <div className="text-center py-4">
              <CheckCircle2 className="mx-auto mb-3 text-green-600 dark:text-green-400" size={36} />
              <p className="text-sm font-medium text-[#1A1A20] dark:text-[#E8E4DC]">Check your inbox</p>
              <p className="text-xs text-[#7A766E] dark:text-[#9E9A90] mt-1.5">
                If an account exists for <span className="font-medium">{email}</span>, a password reset link is on its way.
              </p>
              <p className="text-[11px] text-[#7A766E] dark:text-[#9E9A90] mt-2">
                Don't see it? Check your <span className="font-semibold">Spam</span> or <span className="font-semibold">Promotions</span> folder — it can take a few minutes to arrive.
              </p>
              <button
                type="button"
                onClick={() => switchView('login')}
                className="mt-6 text-xs font-semibold text-[#C45525] dark:text-[#E07A4F] hover:underline"
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {view === 'signup' && (
                <div>
                  <label className="block text-xs uppercase font-bold tracking-wider text-[#7A766E] dark:text-[#9E9A90] mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A766E] dark:text-[#9E9A90]">
                      <User size={16} />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 block w-full bg-[#FAF7F2] dark:bg-[#131318] border border-[#E8E4DC] dark:border-[#2A2A35] text-[#1A1A20] dark:text-[#E8E4DC] rounded-sm focus:outline-none focus:border-[#C45525] dark:focus:border-[#E07A4F] text-sm py-2.5 px-3 transition-colors"
                      placeholder="Virginia Woolf"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs uppercase font-bold tracking-wider text-[#7A766E] dark:text-[#9E9A90] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A766E] dark:text-[#9E9A90]">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 block w-full bg-[#FAF7F2] dark:bg-[#131318] border border-[#E8E4DC] dark:border-[#2A2A35] text-[#1A1A20] dark:text-[#E8E4DC] rounded-sm focus:outline-none focus:border-[#C45525] dark:focus:border-[#E07A4F] text-sm py-2.5 px-3 transition-colors"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              {view !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs uppercase font-bold tracking-wider text-[#7A766E] dark:text-[#9E9A90]">
                      Password
                    </label>
                    {view === 'login' && (
                      <button
                        type="button"
                        onClick={() => switchView('forgot')}
                        className="text-[11px] font-semibold text-[#C45525] dark:text-[#E07A4F] hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7A766E] dark:text-[#9E9A90]">
                      <Lock size={16} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 block w-full bg-[#FAF7F2] dark:bg-[#131318] border border-[#E8E4DC] dark:border-[#2A2A35] text-[#1A1A20] dark:text-[#E8E4DC] rounded-sm focus:outline-none focus:border-[#C45525] dark:focus:border-[#E07A4F] text-sm py-2.5 px-3 transition-colors"
                      placeholder="Enter your password"
                      required
                      minLength={isFirebaseConfigured ? 6 : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#7A766E] dark:text-[#9E9A90] hover:text-[#1A1A20] dark:hover:text-[#E8E4DC]"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 bg-[#1A1A20] dark:bg-[#E8E4DC] hover:bg-[#C45525] dark:hover:bg-[#E07A4F] disabled:opacity-60 disabled:cursor-not-allowed text-[#FAF7F2] dark:text-[#1A1A20] dark:hover:text-[#FFFFFF] py-3 px-4 rounded-sm text-sm font-medium transition-colors"
              >
                <span>
                  {submitting
                    ? 'Please wait…'
                    : view === 'login' ? 'Sign In' : view === 'signup' ? 'Create Account' : 'Send Reset Link'}
                </span>
                <ArrowRight size={15} />
              </button>

              {view === 'forgot' && (
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="w-full text-center text-xs font-semibold text-[#7A766E] dark:text-[#9E9A90] hover:text-[#C45525] dark:hover:text-[#E07A4F]"
                >
                  Back to sign in
                </button>
              )}
            </form>
          )}

          {/* Demo Login Shortcuts — only relevant before Firebase Auth is set up */}
          {!isFirebaseConfigured && view !== 'forgot' && (
            <div className="mt-8 pt-6 border-t border-[#E8E4DC] dark:border-[#2A2A35]">
              <div className="flex items-center gap-1.5 text-xs text-[#7A766E] dark:text-[#9E9A90] font-semibold mb-3">
                <KeyRound size={13} className="text-[#C45525]" />
                <span>Quick Demo Credentials</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleFillDemo('user@example.com', 'password123')}
                  className="text-left p-2.5 rounded-sm bg-[#FAF7F2] dark:bg-[#131318] border border-[#E8E4DC] dark:border-[#2A2A35] hover:border-[#C45525] dark:hover:border-[#E07A4F] transition-colors"
                >
                  <div className="text-xs font-semibold text-[#1A1A20] dark:text-[#E8E4DC]">Reader Account</div>
                  <div className="text-[11px] text-[#7A766E] dark:text-[#9E9A90] truncate">user@example.com</div>
                </button>

                <button
                  type="button"
                  onClick={() => handleFillDemo('admin@example.com', 'adminpassword')}
                  className="text-left p-2.5 rounded-sm bg-[#FAF7F2] dark:bg-[#131318] border border-[#E8E4DC] dark:border-[#2A2A35] hover:border-[#C45525] dark:hover:border-[#E07A4F] transition-colors"
                >
                  <div className="text-xs font-semibold text-[#1A1A20] dark:text-[#E8E4DC]">Curator / Admin</div>
                  <div className="text-[11px] text-[#7A766E] dark:text-[#9E9A90] truncate">admin@example.com</div>
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-[#7A766E] dark:text-[#9E9A90] mt-6">
          By continuing, you agree to S LV BOOK CENTER reader terms and catalog policies.
        </p>
      </div>
    </div>
  );
};

export default Auth;
