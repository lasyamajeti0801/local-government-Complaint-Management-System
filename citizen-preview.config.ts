import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-citizen-preview',
    rollupOptions: {
      input: resolve(__dirname, 'citizen-preview.html'),
    },
  },
});
