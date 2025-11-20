async function postAuthAction(payload: Record<string, unknown>) {
  const response = await fetch('/api/auth/sign-in', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    credentials: 'include',
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || 'Authentication failed');
  }
  return data;
}

export const authClient = {
  session: async () => {
    try {
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
      });
      return await response.json();
    } catch {
      return { user: null };
    }
  },
  signIn: {
    email: async ({ email, password }: { email: string; password: string }) => {
      try {
        const response = await fetch('/api/auth/sign-in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sign-in', email, password }),
          credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok) {
          return { error: data.error || { message: 'Sign in failed' } };
        }

        return { data: data.user };
      } catch (error) {
        return { error: { message: (error as Error).message || 'Network error' } };
      }
    },
  },
  signUp: async ({ name, email, password }: { name: string; email: string; password: string }) => {
    try {
      const response = await fetch('/api/auth/[...all]', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sign-up', name, email, password }),
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || { message: 'Sign up failed' } };
      }
      return { data };
    } catch (error) {
      return { error: { message: (error as Error).message || 'Network error' } };
    }
  },
  resendVerification: async (email: string) => {
    try {
      await postAuthAction({ action: 'resend-verification', email });
      return { success: true };
    } catch (error) {
      return { error: { message: (error as Error).message || 'Unable to resend verification' } };
    }
  },
  verifyEmail: async (token: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) {
        return { error: data.error || { message: 'Verification failed' } };
      }
      return { data: data.user };
    } catch (error) {
      return { error: { message: (error as Error).message || 'Network error' } };
    }
  },
  signOut: async () => {
    try {
      await fetch('/api/auth/sign-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sign-out' }),
        credentials: 'include',
      });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  },
};

