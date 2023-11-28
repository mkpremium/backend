module.exports = {
  recursive: true,
  exit: true,
  require: 'test/setup.js',
  timeout: 30000,
  'node-option': ['unhandled-rejections=strict'],
  'trace-warnings': true, // node flags ok
}
