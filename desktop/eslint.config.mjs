import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {ignores: ['dist/**', 'release/**', 'node_modules/**', '.yarn/**']},
  {
    files: ['**/*.ts'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {...globals.browser, ...globals.node},
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', {argsIgnorePattern: '^_'}],
    },
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {...globals.node},
    },
  },
)
