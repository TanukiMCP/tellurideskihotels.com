import { defineMiddleware } from 'astro:middleware';
import { getSessionFromRequest } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Get session for all routes (not just admin) so it's available site-wide
  const session = await getSessionFromRequest(context.request);
  
  if (session) {
    // Store session in locals for use in pages
    context.locals.session = { user: session.user, session: { token: '', expiresAt: new Date(session.expiresAt) } };
    context.locals.user = session.user;
  } else {
    // Explicitly set to null so pages know there's no session
    context.locals.session = null;
    context.locals.user = null;
  }

  // Admin routes require authentication (except login page)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!session) {
      return context.redirect('/admin/login');
    }
  }

  return next();
});

