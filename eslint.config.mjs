import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: [
      'node_modules/**',
      'out/**',
      'coverage/**',
      'plugins/**',
      'jest.config.ts',
      'knexfile.ts',
    ],
  },
  {
    files: ['**/*.ts'],
    ...js.configs.recommended,
  },
  ...tsPlugin.configs['flat/recommended'],
  prettier,
  {
    files: ['**/*.ts'],
    rules: {
      'no-unused-vars': 'off',
      'no-await-in-loop': 'off',
      'prefer-destructuring': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
        },
      ],
      // Needed for functions that are defined later in a file.
      '@typescript-eslint/no-use-before-define': 'off',
    },
  },
];
