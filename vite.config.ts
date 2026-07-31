import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// `--mode singlefile` collapses the lazy chunks back into one file for
// scripts/build-single-file.mjs, which needs a single self-contained bundle.
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  build:
    mode === 'singlefile'
      ? { rollupOptions: { output: { inlineDynamicImports: true } } }
      : {},
}));
