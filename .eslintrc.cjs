/* ESLint for the LiftWise app and packages. Legacy files (classic app) are ignored until removed. */
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:react-hooks/recommended'],
  ignorePatterns: [
    'dist', 'node_modules', '**/node_modules', 'deployment-package', 'design', 'app.js', 'public/sw.js',
    'src/TrainingProgram.tsx', 'src/services/notifications.ts', 'src/lib/supabase.ts',
    'packages/core/src/templates/lukas-source.ts', '*.cjs', '**/dist',
  ],
  rules: {
    'react-refresh/only-export-components': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/no-non-null-assertion': 'off',
  },
};
