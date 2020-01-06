module.exports = (api) => {
  api.cache(true)

  return {
    presets: [
      ['@babel/preset-env', {
        targets: {
          node: true
        }
      }]
    ],
    sourceMaps: 'both'
  }
}
