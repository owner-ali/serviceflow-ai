import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@serviceflow/api': path.resolve(__dirname, '../../packages/api/src'),
      '@serviceflow/types': path.resolve(__dirname, '../../packages/types/src'),
    },
  },
});
