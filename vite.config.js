import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Alias para src/
    },
  },
  server: {
    host: '0.0.0.0', // Permite conexiones desde cualquier dirección IP en la red local
    port: 5173,      // Puerto predeterminado de Vite (puedes cambiarlo si lo necesitas)
    strictPort: true, // Falla si el puerto está ocupado
    open: true,      // Abre el navegador automáticamente al iniciar
    cors: true,      // Habilita CORS para el servidor de desarrollo
  },
  build: {
    outDir: 'dist',       // Carpeta de salida para el build
    sourcemap: true,      // Genera sourcemaps para depuración
    minify: 'esbuild',    // Usa esbuild para minificación rápida
    target: 'esnext',     // Soporte para las últimas características de JS
  },
});
