import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react', 'react-hot-toast'],
          charts: ['recharts'],
          router: ['react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          utils: ['date-fns']
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production')
  }
});
