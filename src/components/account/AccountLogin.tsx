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


