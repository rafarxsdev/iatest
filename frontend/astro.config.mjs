import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [react(), tailwind()],
  vite: {
    // El catálogo de íconos es muy grande; no pre-empaquetarlo en deps compartidas (evita fallos MIME / corruptos en dev).
    optimizeDeps: {
      exclude: ['src/lib/icons-catalog.ts'],
    },
    server: {
      // true = 0.0.0.0: accesible en red local y evita “use --host to expose”
      host: true,
      port: 4321,
      strictPort: false,
      proxy: {
        // Misma origen que el frontend: la cookie JWT queda en el origen del dev server
        '/api': {
          target: 'http://127.0.0.1:3000',
          changeOrigin: true,
        },
      },
    },
  },
});
