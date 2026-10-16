import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

export default defineConfig(({ command }) => {
  // Base path resolution for GitHub Pages:
  // In development (dev server): use root '/'
  // In production (build):
  // 1. If BASE_URL is set (from GitHub Actions steps.pages.outputs.base_path), use it
  // 2. If GITHUB_REPOSITORY is present ('user/planification'), use `/${repo}/`
  // 3. Default fallback to '/planification/'
  let base = '/';
  if (command === 'build') {
    if (process.env.BASE_URL) {
      base = process.env.BASE_URL.endsWith('/') ? process.env.BASE_URL : `${process.env.BASE_URL}/`;
    } else if (process.env.GITHUB_REPOSITORY) {
      const repo = process.env.GITHUB_REPOSITORY.split('/')[1];
      base = `/${repo}/`;
    } else {
      base = '/planification/';
    }
  }

  return {
    base,
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'copy-404-for-github-pages',
        closeBundle() {
          const distDir = path.resolve(process.cwd(), 'dist');
          const indexPath = path.join(distDir, 'index.html');
          const notFoundPath = path.join(distDir, '404.html');
          if (fs.existsSync(indexPath)) {
            fs.copyFileSync(indexPath, notFoundPath);
          }
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
