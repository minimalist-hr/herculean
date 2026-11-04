import { defineConfig } from 'eslint/config';
import expoConfig from 'eslint-config-expo/flat.js';
import { configs } from 'typescript-eslint';

export default defineConfig([
  expoConfig,
  configs.strictTypeChecked,
  configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  { files: ['**/*.mjs'], extends: [configs.disableTypeChecked] },
  {
    files: ['src/**/*.tsx'],
    ignores: ['**/*.test.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: ['Pressable'],
              message: 'Use Tappable, so every action reacts when pressed.',
            },
          ],
        },
      ],
    },
  },
  { ignores: ['dist/*', '.expo/*', 'coverage/*', 'src/api/schema.ts'] },
]);
