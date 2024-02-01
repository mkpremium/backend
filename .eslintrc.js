module.exports = {
  extends: ['standard', 'eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  root: true,
  env: {
    node: true
  },
  rules: {
    indent: ['error', 2],
    'no-useless-constructor': 'off',
    'no-use-before-define': 'off',
    '@typescript-eslint/no-explicit-any': 'off'
  },
  overrides: [
    {
      files: [
        'test/**/*.[jt]s',
        'test-e2e/**/*.[jt]s'
      ],
      extends: ['plugin:mocha/recommended'],
      plugins: ['mocha'],
      rules: {
        'no-unused-expressions': 'off',
        'mocha/no-setup-in-describe': 'off',
        'no-redeclare': 'off',
        'mocha/no-mocha-arrows': 'off',
        '@typescript-eslint/no-explicit-any': 'off'
      },
      env: {
        node: true,
        mocha: true
      }
    }
  ]
}
