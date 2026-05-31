import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    dts({ entryRoot: resolve(__dirname, 'src') }),
    cssInjectedByJsPlugin(),
  ],
  build: {
    sourcemap: true,
    lib: {
      entry: { index: 'src/index.ts' },
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
  },
});
