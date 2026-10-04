import js from '@eslint/js';
import globals from 'globals';
import hooks from 'eslint-plugin-react-hooks';
import { componentBoundaries } from './tooling/component-boundaries.js';
export default [
  { ignores: ['dist/**', '.npm-cache/**'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,mjs}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      'react-hooks': hooks,
      connecto: { rules: { 'component-boundaries': componentBoundaries } },
    },
    rules: {
      ...hooks.configs.recommended.rules,
      'connecto/component-boundaries': 'error',
      'no-unused-vars': [
        'error',
        { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^[A-Z_]' },
      ],
    },
  },
  {
    files: ['src/features/**/*.{js,jsx}', 'src/shared/**/*.{js,jsx}', 'src/app/**/*.jsx'],
    rules: {
      'no-restricted-globals': ['error', 'fetch', 'localStorage', 'sessionStorage'],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'MemberExpression[property.name=/^(fetch|localStorage|sessionStorage)$/]',
          message:
            'UI components receive data and operations through props; keep transport and persistence outside UI.',
        },
      ],
    },
  },
];
