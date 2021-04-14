import couchbase from '../src/db/couchbase'
import { createDiContainer } from '../src/infrastructure/dependencies'

/**
 * @return {PromiseLike<AwilixContainer>}
 */
export const createTestContainer = () => {
  return couchbase()
    .then(bucket => Promise.all([ bucket.flushAsync(), createDiContainer(bucket, true) ]))
    .then(([ _, container ]) => container)
}
