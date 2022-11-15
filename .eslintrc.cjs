module.exports = {
  env: {
    es2021: true,
    node: true,
    jest: true,
  },
  extends: ['@netly/eslint-config-base'],
  ignorePatterns: ['dist/**'],
  rules: {
    'no-await-in-loop': 0,
    'consistent-return': 0,
    'import/extensions': [0, { js: 'always' }],
  },
};
