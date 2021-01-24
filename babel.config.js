module.exports = {
  presets: [
    [
      '@babel/env',
      {
        targets: {
          browsers: ['> 5%, last 2 versions, Firefox ESR, not dead, not IE 9-11, not op_mini all'],
        },
      },
    ],
    '@babel/typescript',
  ],
  plugins: ['@babel/proposal-class-properties', '@babel/proposal-object-rest-spread'],
};
