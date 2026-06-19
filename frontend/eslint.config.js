import { readFileSync } from 'node:fs'
import vue from 'eslint-plugin-vue'
import vueTs from '@vue/eslint-config-typescript'
import oxlint from 'eslint-plugin-oxlint'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

const autoImportGlobals = JSON.parse(
  readFileSync(new URL('./.eslintrc-auto-import.json', import.meta.url), 'utf8'),
).globals

const fsdLayers = [
  { layer: 'shared', forbidden: ['app', 'pages', 'widgets', 'features', 'entities'] },
  { layer: 'entities', forbidden: ['app', 'pages', 'widgets', 'features'] },
  { layer: 'features', forbidden: ['app', 'pages', 'widgets'] },
  { layer: 'widgets', forbidden: ['app', 'pages'] },
  { layer: 'pages', forbidden: ['app'] },
]

const layerRules = fsdLayers.map(({ layer, forbidden }) => ({
  files: [`src/${layer}/**/*.{ts,vue}`],
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: forbidden.map((upper) => ({
          group: [`@/${upper}/*`],
          message: `FSD: "${layer}" не должен импортировать из "${upper}".`,
        })),
      },
    ],
  },
}))

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'src/auto-imports.d.ts',
      'src/components.d.ts',
    ],
  },
  ...vue.configs['flat/recommended'],
  ...vueTs(),
  {
    languageOptions: {
      globals: { ...globals.browser, ...autoImportGlobals },
    },
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  ...layerRules,
  {
    files: ['src/router/**/*.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
  ...oxlint.configs['flat/recommended'],
  prettier,
]
