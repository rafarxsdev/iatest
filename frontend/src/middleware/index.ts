import { defineMiddleware } from 'astro:middleware';
import { backendBaseUrl } from '@lib/api-base';
import { getSession } from '@lib/auth';

const PUBLIC_ROUTES = ['/login'] as const;

function isPublicPath(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname === `${route}/`);
}

/**
 * Chunks y assets del dev server (Vite) y del build (`/_astro`).
 * No deben pasar por `getSession()`: cada import dispara una petición; si `/api/auth/me`
 * falla o tarda, el redirect a `/login` devolvía HTML y el navegador mostraba
 * "Loading failed for the module" para `.js` / toolbar de Astro, etc.
 */
function isViteOrBundledAsset(pathname: string): boolean {
  return (
    pathname.startsWith('/node_modules/') ||
    pathname.startsWith('/@vite/') ||
    pathname.startsWith('/@fs/') ||
    pathname.startsWith('/@id/') ||
    pathname.startsWith('/src/') ||
    pathname.startsWith('/_astro/') ||
    pathname.startsWith('/_image') ||
    pathname === '/favicon.ico'
  );
}

/** Producción (Node standalone) no tiene proxy de Vite: reenviar /api/* a Express (mismo origen :4321). */
async function proxyApiToBackend(request: Request, pathname: string, search: string): Promise<Response> {
  const target = `${backendBaseUrl()}${pathname}${search}`;
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('connection');

  const init: RequestInit & { duplex?: 'half' } = {
    method: request.method,
    headers,
    redirect: 'manual',
  };

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
    init.duplex = 'half';
  }

  return fetch(target, init);
}

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname;

  if (pathname.startsWith('/api/')) {
    return proxyApiToBackend(context.request, pathname, context.url.search);
  }

  if (isViteOrBundledAsset(pathname)) {
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
