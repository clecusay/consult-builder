import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      name: 'TreatmentBuilder',
      formats: ['iife'],
      fileName: () => 'widget.js',
    },
    outDir: 'dist',
    cssCodeSplit: false, // Bundle CSS into JS
    minify: 'terser',
    terserOptions: {
      compress: {
        passes: 3,
        drop_console: true,
      },
    },
    sourcemap: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  resolve: {
    alias: {
      '@treatment-builder/shared': resolve(__dirname, '../../packages/shared/src'),
    },
  },
});
