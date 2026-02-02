import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // If we are in GitHub Actions, GITHUB_REPOSITORY is available (e.g., "user/repo")
  const githubRepo = process.env.GITHUB_REPOSITORY;
  const base = githubRepo ? `/${githubRepo.split('/')[1]}/` : '/';

  return {
    base,
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(process.env.API_KEY || env.API_KEY)
    },
    publicDir: 'public'
  };
});