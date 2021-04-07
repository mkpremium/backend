#! /usr/bin/env node

const createCluster = require('./couchbase/create-cluster')
const createBucket = require('./couchbase/create-bucket')

createCluster()
  .then(() => createBucket('mkpremium'))
  .then(() => createBucket('mkpremium_test'))
  .then(() => {
    console.log('Done!')
    process.exit()
  })
  .catch(error => {
    console.error('Something failed', { error })
    process.exit(1)
  })
