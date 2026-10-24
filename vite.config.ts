import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    // Relative base ensures asset URLs resolve correctly on any GitHub Pages repository name or domain
    base: './',
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'github-pages-helper',
        transformIndexHtml: {
          order: 'pre',
          handler(html) {
            return html
              .replace(/<link[^>]*id="gh-raw-css"[^>]*>\s*/g, '')
              .replace(/<script[^>]*id="gh-raw-js"[^>]*><\/script>\s*/g, '')
              .replace(
                '<!-- VITE_DEV_OR_BUILD_ENTRY -->',
                '<script type="module" src="./src/main.tsx"></script>'
              );
          },
        },
        closeBundle() {
          const rootDir = process.cwd();
          const distDir = path.resolve(rootDir, 'dist');
          const docsDir = path.resolve(rootDir, 'docs');
          const publicDir = path.resolve(rootDir, 'public');
          const indexPath = path.join(distDir, 'index.html');
          const notFoundPath = path.join(distDir, '404.html');
          const noJekyllPath = path.join(distDir, '.nojekyll');

          // Ensure 404.html fallback exists for GitHub Pages SPA routing
          if (fs.existsSync(indexPath)) {
            fs.copyFileSync(indexPath, notFoundPath);
          }
          // Ensure .nojekyll exists in dist
          fs.writeFileSync(noJekyllPath, '# Disable Jekyll\n');

          // Clean and mirror dist into docs/ so "Deploy from branch -> /docs" and "/ (root)" always have fresh assets
          if (fs.existsSync(distDir)) {
            fs.rmSync(docsDir, { recursive: true, force: true });
            fs.cpSync(distDir, docsDir, { recursive: true, force: true });
          }

          // Copy static root icons/.nojekyll so "/ (root)" mode also resolves ./logo.png and .nojekyll
          for (const file of ['logo.png', 'logo.svg', 'favicon.svg', '.nojekyll']) {
            const srcFile = path.join(publicDir, file);
            const destFile = path.join(rootDir, file);
            if (fs.existsSync(srcFile)) {
              fs.copyFileSync(srcFile, destFile);
            }
          }

          // Update root index.html fallback asset filenames to match the latest build in docs/assets/
          const rootIndexPath = path.join(rootDir, 'index.html');
          if (fs.existsSync(indexPath) && fs.existsSync(rootIndexPath)) {
            const builtHtml = fs.readFileSync(indexPath, 'utf-8');
            const jsMatch = builtHtml.match(/src="\.\/assets\/(index-[^"]+\.js)"/);
            const cssMatch = builtHtml.match(/href="\.\/assets\/(index-[^"]+\.css)"/);
            let rootHtml = fs.readFileSync(rootIndexPath, 'utf-8');
            if (cssMatch) {
              rootHtml = rootHtml.replace(
                /href="\.\/docs\/assets\/index-[^"]+\.css"/,
                `href="./docs/assets/${cssMatch[1]}"`
              );
            }
            if (jsMatch) {
              rootHtml = rootHtml.replace(
                /src="\.\/docs\/assets\/index-[^"]+\.js"/,
                `src="./docs/assets/${jsMatch[1]}"`
              );
            }
            fs.writeFileSync(rootIndexPath, rootHtml);
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
