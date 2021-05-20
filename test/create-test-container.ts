import couchbase from '../src/db/legacy-connect-couchbase'
import { createDiContainer } from '../src/infrastructure/dependencies'

export const createTestContainer = () => {
  return couchbase()
    .then(bucket => Promise.all([
      new Promise(resolve => {
        bucket.manager().flush(() => setTimeout(resolve, 500))
      }),
      createDiContainer(bucket)
    ]))
    .then(([ _, container ]) => container)
}
