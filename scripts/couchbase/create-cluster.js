const axios = require('axios')

module.exports = () => {
  const httpClient = axios.create({
    baseURL: 'http://localhost:8091/',
    auth: {
      username: 'couchbase',
      password: 'couchbase'
    },
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })

  return httpClient.post('pools/default', `memoryQuota=512&indexMemoryQuota=512`)
    .then(() => httpClient.post('node/controller/setupServices', 'services=kv%2cn1ql%2Cindex'))
    .then(() => httpClient.post('settings/web', 'port=8091&username=couchbase&password=couchbase'))
    .then(() => httpClient.post('settings/indexes', 'storageMode=forestdb'))
}
