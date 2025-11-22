import { useState } from 'react';
import { authClient } from '@/lib/auth-client';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface AccountLoginProps {
  redirectTo?: string;
}

export function AccountLogin({ redirectTo = '/account' }: AccountLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validateField = (field: string, value: string) => {
    const errors: Record<string, string> = {};
    
    if (field === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors.email = 'Please enter a valid email address';
    }
    
    setFieldErrors((prev) => ({ ...prev, ...errors }));
    return Object.keys(errors).length === 0;
  };

  const handleBlur = (field: string, value: string) => {
    validateField(field, value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setPendingVerification(false);
    setFieldErrors({});

    // Validate fields
    let isValid = true;
    if (!email.trim()) {
      setFieldErrors((prev) => ({ ...prev, email: 'Email address is required' }));
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldErrors((prev) => ({ ...prev, email: 'Please enter a valid email address' }));
      isValid = false;
    }
    if (!password) {
      setFieldErrors((prev) => ({ ...prev, password: 'Password is required' }));
      isValid = false;
    }

    if (!isValid) {
      setLoading(false);
      return;
    }

    try {
      const result = await authClient.signIn.email({ email, password });
      if (result.error) {
        if (result.error.code === 'EMAIL_NOT_VERIFIED') {
          setPendingVerification(true);
        }
        throw new Error(result.error.message);
      }

      setSuccess('Signed in successfully. Redirecting…');
      setTimeout(() => {
        window.location.href = redirectTo;
      }, 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await authClient.resendVerification(email);
      if (result.error) {
        throw new Error(result.error.message);
      }
      setSuccess('Verification email sent. Check your inbox.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to resend verification email');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthLogin = (provider: 'google' | 'apple') => {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : redirectTo;
    const state = encodeURIComponent(redirectTo || currentPath);
    window.location.href = `/api/auth/oauth/${provider}?state=${state}`;
  };

  return (
    <div className="w-full max-w-[440px] mx-auto px-6 md:px-0">
      <div className="bg-white border border-neutral-200 rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.08)] p-6 md:p-10">
        {/* Form Header */}
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-[1.5px] text-neutral-500 font-semibold mb-3">
            WELCOME BACK
          </p>
          <h1 className="text-[28px] font-bold text-[#2C2C2C] leading-tight mb-2">
            Sign in to your account
          </h1>
          <p className="text-[15px] text-neutral-600 leading-relaxed">
            Access your bookings and manage your trips
          </p>
        </div>

        {/* Google Sign-In Button */}
        <button
          type="button"
          onClick={() => handleOAuthLogin('google')}
          className="w-full h-12 flex items-center justify-center gap-3 px-4 border border-neutral-300 rounded-lg bg-white hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-150 cursor-pointer mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="text-[15px] font-medium text-[#2C2C2C]">Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 bg-white text-[14px] text-neutral-500">Or</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border-2 border-red-500 rounded-lg px-4 py-3 text-sm text-red-700 flex items-start gap-2">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-[#2C2C2C] mb-1.5">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={(e) => handleBlur('email', e.target.value)}
              placeholder="you@example.com"
              className={`w-full h-12 px-3 border rounded-md text-[15px] transition-all ${
                fieldErrors.email
                  ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                  : 'border-neutral-300 focus:border-[#2D5F4F] focus:ring-2 focus:ring-[#2D5F4F]/20'
              }`}
              required
              autoComplete="email"
            />
            {fieldErrors.email && (
              <p className="mt-1.5 text-[13px] text-red-600 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="password" className="block text-sm font-semibold text-[#2C2C2C]">
                Password
              </label>
              <a
                href="/account/forgot-password"
                className="text-[13px] text-[#2D5F4F] hover:underline focus:outline-none focus:ring-2 focus:ring-[#2D5F4F]/20 rounded"
              >
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={(e) => handleBlur('password', e.target.value)}
                placeholder="••••••••"
                className={`w-full h-12 px-3 pr-10 border rounded-md text-[15px] transition-all ${
                  fieldErrors.password
                    ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                    : 'border-neutral-300 focus:border-[#2D5F4F] focus:ring-2 focus:ring-[#2D5F4F]/20'
                }`}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#2D5F4F]/20 rounded p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="mt-1.5 text-[13px] text-red-600 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {fieldErrors.password}
              </p>
            )}
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-[52px] bg-[#2D5F4F] hover:bg-[#1F4436] text-white text-base font-semibold rounded-lg transition-all duration-200 disabled:bg-neutral-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#2D5F4F] focus:ring-offset-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Email Verification Notice */}
        {pendingVerification && (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-800 mb-2">
              Verify your email to finish setting up your account.
            </p>
            <button
              onClick={handleResend}
              disabled={loading}
              className="w-full px-4 py-2 border-2 border-neutral-300 text-neutral-700 bg-white hover:bg-neutral-50 rounded-lg font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Resend verification email'}
            </button>
          </div>
        )}

        {/* Footer Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-600">
            Don't have an account?{' '}
            <a href="/account/join" className="text-[#2D5F4F] font-semibold hover:underline">
              Create one in seconds
            </a>
            .
          </p>
        </div>

        {/* Trust Signals */}
        <div className="mt-4 flex items-center justify-center gap-2 text-[12px] text-neutral-500">
          <Lock className="w-3.5 h-3.5" />
          <span>Your information is secure and encrypted</span>
        </div>
      </div>
    </div>
  );
}


