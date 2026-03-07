import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      tailwindcss(),
    ],
    // SECURITY: Do not expose API keys via define. Use import.meta.env in code.
    resolve: {
      alias: {
        '@': path.resolve(__dirname, "./src"),
        '@components': path.resolve(__dirname, "./src/components"),
        '@dashboard': path.resolve(__dirname, "./src/components/dashboard"),
        '@workflows': path.resolve(__dirname, "./src/components/workflows"),
        '@lib': path.resolve(__dirname, "./src/lib"),
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // React core libraries
            if (id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-router-dom')) {
              return 'react-vendor';
            }

            // Chart library (recharts is typically large)
            if (id.includes('node_modules/recharts')) {
              return 'chart-vendor';
            }

            // Data/query libraries
            if (id.includes('node_modules/@tanstack/react-query')) {
              return 'data-vendor';
            }

            // Radix UI components
            if (id.includes('node_modules/@radix-ui')) {
              return 'ui-vendor';
            }

            // Backend services (Google AI & Supabase)
            if (id.includes('node_modules/@google/genai') ||
              id.includes('node_modules/@supabase')) {
              return 'backend-vendor';
            }

            // Form and utility libraries
            if (id.includes('node_modules/react-hook-form') ||
              id.includes('node_modules/zod') ||
              id.includes('node_modules/fuse.js') ||
              id.includes('node_modules/clsx') ||
              id.includes('node_modules/tailwind-merge')) {
              return 'utils-vendor';
            }

            // Animation libraries (framer-motion)
            if (id.includes('node_modules/framer-motion')) {
              return 'animation-vendor';
            }

            // All other node_modules go into a general vendor chunk
            if (id.includes('node_modules')) {
              return 'vendor';
            }
          },
        },
      },
    }
  };
});
