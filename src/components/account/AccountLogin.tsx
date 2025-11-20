import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authClient } from '@/lib/auth-client';

interface AccountLoginProps {
  redirectTo?: string;
}

export function AccountLogin({ redirectTo = '/account' }: AccountLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingVerification, setPendingVerification] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setPendingVerification(false);

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
    window.location.href = `/api/auth/oauth/${provider}?state=${encodeURIComponent(redirectTo || currentPath)}`;
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-2xl">
      <CardHeader className="space-y-2">
        <p className="text-sm uppercase font-semibold text-primary-600 tracking-wide">Welcome back</p>
        <CardTitle className="text-3xl font-bold text-neutral-900">Sign in to your account</CardTitle>
        <p className="text-neutral-600">
          Access upcoming reservations, download confirmations, and sync bookings across devices.
        </p>
      </CardHeader>
      <CardContent>
        {/* OAuth Buttons */}
        <div className="space-y-3 mb-6">
          <button
            type="button"
            onClick={() => handleOAuthLogin('google')}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-neutral-300 rounded-xl font-semibold text-neutral-700 hover:border-neutral-400 hover:bg-neutral-50 transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
          
          <button
            type="button"
            onClick={() => handleOAuthLogin('apple')}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-black text-white rounded-xl font-semibold hover:bg-neutral-800 transition-all"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            Continue with Apple
          </button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-neutral-500 font-medium">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
              {success}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />

          <Button type="submit" className="w-full" size="lg" isLoading={loading}>
            Sign in
          </Button>
        </form>

        {pendingVerification && (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-800 mb-2">
              Verify your email to finish setting up your account.
            </p>
            <Button variant="outline" onClick={handleResend} isLoading={loading}>
              Resend verification email
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


