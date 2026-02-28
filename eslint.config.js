import { defineConfig } from 'eslint-define-config';
import parser from '@typescript-eslint/parser';

export default defineConfig([
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parser: parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
    },
  },
]);