import couchbase from '../src/db/couchbase'
import { createAwilixContainer } from '../src/infrastructure/dependencies'

export const createTestContainer = () => {
  return couchbase()
    .then(bucket => Promise.all([ bucket.flushAsync(), createAwilixContainer(bucket, true) ]))
    .then(([ _, container ]) => container)
}
