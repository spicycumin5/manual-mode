import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import remarkGfm from 'remark-gfm';

export default defineConfig({
  base: './',
  plugins: [{ enforce: 'pre', ...mdx({ remarkPlugins: [remarkGfm] }) }, react({ include: /\.(mdx|tsx|ts)$/ })],
  // @ts-expect-error vitest config lives alongside vite's
  test: { include: ['tests/**/*.test.ts'] },
});
