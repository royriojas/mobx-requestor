const build = async () => {
  await Bun.build({
    entrypoints: ['./src/index.ts'],
    outdir: './dist',
    naming: {
      entry: '[dir]/[name].cjs',
    },
    external: ['mobx'],
    target: 'browser',
    format: 'cjs',
  });

  await Bun.build({
    entrypoints: ['./src/index.ts'],
    outdir: './dist',
    naming: {
      entry: '[dir]/[name].mjs',
    },
    external: ['mobx'],
    target: 'browser',
    format: 'esm',
  });
};

build().catch(err => console.error(err));
