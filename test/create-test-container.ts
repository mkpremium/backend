import { createDiContainer } from '../src/infrastructure/dependencies'
import { connectCouchbaseBucket } from '../src/db/connect-couchbase-bucket'

export const createTestContainer = () => {
  return connectCouchbaseBucket()
    .then(bucket => Promise.all([
      new Promise(resolve => {
        bucket.manager().flush(() => setTimeout(resolve, 500))
      }),
      createDiContainer(bucket)
    ]))
    .then(([ _, container ]) => container)
}
