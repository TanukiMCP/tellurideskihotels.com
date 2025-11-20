import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authClient } from '@/lib/auth-client';

export function AccountSignup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const result = await authClient.signUp({ name, email, password });
      if (result.error) {
        throw new Error(result.error.message);
      }

      setMessage('Account created. Check your email to verify and activate access.');
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthSignup = async (provider: 'google' | 'apple') => {
    try {
      // Check if OAuth is configured by making a request first
      const response = await fetch(`/api/auth/oauth/${provider}?state=${encodeURIComponent('/account')}`, {
        method: 'GET',
        redirect: 'manual',
      });
      
      if (response.status === 503) {
        // OAuth not configured - show error
        const data = await response.json().catch(() => ({}));
        setError(data.error?.message || `${provider === 'google' ? 'Google' : 'Apple'} OAuth is not configured. Please use email sign-up instead.`);
        return;
      }
      
      // If we get a redirect (3xx), OAuth is configured, follow the redirect
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('Location');
        if (location) {
          window.location.href = location;
        } else {
          // Fallback to direct redirect
          window.location.href = `/api/auth/oauth/${provider}?state=${encodeURIComponent('/account')}`;
        }
      } else {
        // Unexpected response
        setError(`${provider === 'google' ? 'Google' : 'Apple'} sign-up is currently unavailable. Please use email sign-up instead.`);
      }
    } catch (err) {
      // If fetch fails, try direct redirect as fallback
      console.error(`OAuth ${provider} error:`, err);
      window.location.href = `/api/auth/oauth/${provider}?state=${encodeURIComponent('/account')}`;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-2xl">
      <CardHeader className="space-y-2">
        <p className="text-sm uppercase font-semibold text-primary-600 tracking-wide">Create account</p>
        <CardTitle className="text-3xl font-bold text-neutral-900">Bookmark bookings & perks</CardTitle>
        <p className="text-neutral-600">
          Build your Telluride profile, sync reservations across devices, and convert guest bookings into
          a managed account in one step.
        </p>
      </CardHeader>
      <CardContent>
        {/* OAuth Buttons */}
        <div className="mb-6">
          <button
            type="button"
            onClick={() => handleOAuthSignup('google')}
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
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-neutral-500 font-medium">Or sign up with email</span>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm">
              {message}
            </div>
          )}

          <Input
            label="Full name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Jamie Telluride"
            required
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
            />
            <Input
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <Button type="submit" className="w-full" size="lg" isLoading={loading}>
            Create account
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}


