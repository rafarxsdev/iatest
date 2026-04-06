import { defineMiddleware } from 'astro:middleware';
import { getSession } from '@lib/auth';

const PUBLIC_ROUTES = ['/login'] as const;

function isPublicPath(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname === `${route}/`);
}

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname;

  // El API REST vive en Express (:3000). Con PUBLIC_BACKEND_URL el navegador no pasa por aquí;
  // si alguien llama /api/* al origen del Astro (:4321), no debe redirigirse a /login (302).
  // En producción sin proxy, configura PUBLIC_BACKEND_URL o un reverse proxy hacia el backend.
  if (pathname.startsWith('/api/')) {
    return next();
  }

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
