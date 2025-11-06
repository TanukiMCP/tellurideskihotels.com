import { defineMiddleware } from 'astro:middleware';
import { getSessionFromRequest } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Admin routes require authentication (except login page)
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const session = await getSessionFromRequest(context.request);

    if (!session) {
      return context.redirect('/admin/login');
    }

    // Store session in locals for use in pages
    context.locals.session = { user: session.user, session: { token: '', expiresAt: new Date(session.expiresAt) } };
    context.locals.user = session.user;
  }

  return next();
});

