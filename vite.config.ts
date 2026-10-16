import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    // Relative base ensures asset URLs resolve correctly on any GitHub Pages repository name
    base: './',
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'github-pages-helper',
        closeBundle() {
          const distDir = path.resolve(process.cwd(), 'dist');
          const indexPath = path.join(distDir, 'index.html');
          const notFoundPath = path.join(distDir, '404.html');
          const noJekyllPath = path.join(distDir, '.nojekyll');

          // Ensure 404.html fallback exists for GitHub Pages SPA routing
          if (fs.existsSync(indexPath)) {
            fs.copyFileSync(indexPath, notFoundPath);
          }
          // Ensure .nojekyll exists in dist
          fs.writeFileSync(noJekyllPath, '# Disable Jekyll\n');
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
