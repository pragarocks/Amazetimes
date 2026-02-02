
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  return {
    // Using an empty string or './' makes all asset paths relative.
    // This allows the site to work on pragarocks.github.io/Amazetimes/ 
    // AND on amazetimes.in automatically.
    base: '', 
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY || env.API_KEY)
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
    },
    publicDir: 'public'
  };
});
