import couchbase from '../src/db/legacy-connect-couchbase'
import { createDiContainer } from '../src/infrastructure/dependencies'

export const createTestContainer = () => {
    return couchbase()
        .then(bucket => Promise.all([
            bucket.cluster.buckets().flushBucket(bucket.name),
            createDiContainer(bucket)
        ]))
        .then(([ _, container ]) => container)
}
