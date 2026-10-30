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
  { ignores: ['dist/*', '.expo/*', 'coverage/*'] },
]);
