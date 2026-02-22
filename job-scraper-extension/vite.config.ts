import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        serviceWorker: resolve(__dirname, 'src/background/service-worker.ts'),
        contentScript: resolve(__dirname, 'src/content/content-script.ts'),
      },
      output: {
        entryFileNames: chunk => {
          if (chunk.name === 'serviceWorker') return 'background/service-worker.js';
          if (chunk.name === 'contentScript') return 'content/content-script.js';
          return 'assets/[name].js';
        },
      },
    },
  },
});
