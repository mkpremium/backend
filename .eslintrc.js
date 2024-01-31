module.exports = {
  extends: 'standard',
  env: {
    node: true
  },
  overrides: [
    {
      files: [
        'test/**/*.js',
        'test-e2e/**/*.js'
      ],
      rules: {
        'no-unused-expressions': 'off'
      },
      env: {
        mocha: true
      }
    }
  ]
}
