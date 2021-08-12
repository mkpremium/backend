const { httpClient } = require('./http-client');

module.exports = () => {
  return httpClient.post('pools/default', `memoryQuota=2048&indexMemoryQuota=1024`)
    .then(() => httpClient.post('node/controller/setupServices', 'services=kv%2cn1ql%2Cindex'))
    .then(() => httpClient.post('settings/web', 'port=8091&username=couchbase&password=couchbase'))
    .then(() => httpClient.post('settings/indexes', 'storageMode=forestdb'))
}
