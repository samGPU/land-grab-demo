import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '19.2' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Disable prop-types validation (using vanilla JS, not TypeScript)
      'react/prop-types': 'off',
      // Allow R3F unknown DOM properties (they're Three.js props)
      'react/no-unknown-property': ['error', { 
        ignore: [
          'args', 'position', 'intensity', 'castShadow', 'roughness', 'metalness',
          'geometry', 'transparent', 'side', 'visible', 'object'
        ] 
      }],
      // Allow unused vars that start with underscore
      'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    },
  },
]
