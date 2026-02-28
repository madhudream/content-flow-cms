import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'react/index': resolve(__dirname, 'src/react/index.ts'),
        'webcomponent/index': resolve(__dirname, 'src/webcomponent/index.ts'),
      },
      formats: ['es'],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'zustand'],
      output: {
        preserveModules: false,
      },
    },
    sourcemap: true,
    minify: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
  },
});
