import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { authClient } from '@/lib/auth-client';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface AccountVerifyProps {
  token?: string;
}

export function AccountVerify({ token }: AccountVerifyProps) {
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'idle');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setMessage('Missing verification token. Use the link in your email to continue.');
      setStatus('error');
      return;
    }

    const verify = async () => {
      setStatus('loading');
      const result = await authClient.verifyEmail(token);
      if (result.error) {
        setStatus('error');
        setMessage(result.error.message || 'Unable to verify email.');
        return;
      }
      setStatus('success');
      setMessage('Email verified! Redirecting you to your account.');
      setTimeout(() => (window.location.href = '/account'), 1200);
    };

    verify();
  }, [token]);

  return (
    <Card className="max-w-xl mx-auto shadow-2xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-neutral-900">Confirm your email</CardTitle>
        <p className="text-neutral-600">
          We use email verification to keep guest and account bookings secure across every device.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            status === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : status === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-primary-200 bg-primary-50 text-primary-800'
          }`}
        >
          {status === 'loading' ? 'Verifying your account…' : message}
        </div>

        {status === 'error' && (
          <Button variant="outline" onClick={() => (window.location.href = '/account/login')}>
            Return to login
          </Button>
        )}
      </CardContent>
    </Card>
  );
}


