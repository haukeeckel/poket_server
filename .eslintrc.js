module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    semi: ['error', 'always'],
    quotes: ['error', 'single'],
    'require-await': 'error',
    'no-console': 'warn',
    'no-multiple-empty-lines': 'error',
    'no-multi-spaces': 'error',
  },
};
