import { defineMiddleware } from 'astro:middleware';
import { auth } from './lib/auth';

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Admin routes require authentication
  if (pathname.startsWith('/admin')) {
    const session = await auth.api.getSession({
      headers: context.request.headers,
    });

    if (!session) {
      return context.redirect('/admin/login');
    }

    // Store session in locals for use in pages
    context.locals.session = session;
    context.locals.user = session.user;
  }

  return next();
});

