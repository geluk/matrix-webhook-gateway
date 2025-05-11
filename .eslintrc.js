module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'airbnb-base',
    'airbnb-typescript/base',
    'prettier',
  ],
  env: {
    jest: true,
  },
  rules: {
    'class-methods-use-this': ['off'],
    'no-underscore-dangle': [
      'error',
      {
        allowAfterThis: true,
      },
    ],
    'no-restricted-syntax': ['off'],
    'no-unused-vars': ['off'],
    'no-await-in-loop': ['off'],
    'prefer-destructuring': ['off'],
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/no-use-before-define': ['off'], // needed for functions that are defined later in a file
  },
  ignorePatterns: [
    'plugins',
    'jest.config.ts',
    'knexfile.ts'
  ],
};
