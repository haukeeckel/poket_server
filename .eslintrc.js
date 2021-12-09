module.exports = {
  env: {
    node: true,
    browser: true,
    es2021: true,
  },
  extends: ['airbnb-base'],
  parserOptions: {
    ecmaVersion: 13,
    sourceType: 'module',
  },
  rules: {
    semi: ['warn', 'always'],
    quotes: ['error', 'single'],
    'require-await': 'error',
    'no-console': 'warn',
    'no-multiple-empty-lines': 'error',
    'no-multi-spaces': 'error',
  },
};
