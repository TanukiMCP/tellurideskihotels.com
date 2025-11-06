export const authClient = {
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
        return { error: { message: 'Network error' } };
      }
    },
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

