import netlyConfig from '@netly/eslint-config-base';

export default [
  ...netlyConfig,
  {
    ignores: ['dist'],
  },
];
