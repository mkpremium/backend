const createCluster = require('./create-cluster')
const createBucket = require('./create-bucket')

createCluster()
  .then(() => createBucket())
  .then(() => {
    console.log('Done!')
    process.exit()
  })
  .catch(error => {
    console.error('Something failed', { error })
    process.exit(1)
  })
