import { defineMiddleware } from 'astro:middleware';
import { getSession } from '@lib/auth';

const PUBLIC_ROUTES = ['/login'] as const;

function isPublicPath(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname === `${route}/`);
}

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname;
  const cookieHeader = context.request.headers.get('cookie') ?? '';
  const user = await getSession(cookieHeader);

  if (isPublicPath(pathname)) {
    if (user) {
      return context.redirect('/dashboard');
    }
    return next();
  }

  if (!user) {
    return context.redirect('/login');
  }

  context.locals.user = user;
  return next();
});
