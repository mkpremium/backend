import honeycomb from 'honeycomb-beeline'

honeycomb({
  writeKey: process.env.HONEYCOMB_WRITE_KEY,
  dataset: 'backend',
  serviceName: 'api'
})
