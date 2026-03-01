import { resolve } from 'path';

import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [dts({ entryRoot: resolve(__dirname, 'src') })],
  build: {
    sourcemap: true,
    lib: {
      entry: [resolve(__dirname, 'src/index.ts')],
      name: 'i18nTyped',
      fileName: 'index',
      formats: ['es', 'cjs'],
    },
  },
});
