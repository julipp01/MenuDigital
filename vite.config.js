import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0', // Permite conexiones desde cualquier IP
    port: 5173,
    strictPort: true,
    open: false, // Mejor desactivar para evitar que abra automáticamente
    cors: true,
    
    // 🔥 Configuración crítica para QR en móviles:
    hmr: {
      clientPort: 5173, // Usa el mismo puerto para HMR
      protocol: 'ws',
      // Eliminamos host fijo para que Vite use la IP de red automáticamente
      // host: '192.168.18.22' // Comentado o eliminado
    },
    
    // 🔄 Proxy para API (evita problemas CORS)
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Ajusta a tu URL de backend
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'esbuild',
    target: 'esnext',
    // ⚡ Optimización para producción:
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          vendors: ['axios', 'framer-motion']
        }
      }
    }
  },
  // 🛡️ Opcional: Prevenir errores de caché en desarrollo
  cacheDir: './.vite-cache'
});