import Couchbase, { N1qlQuery, SearchQuery } from 'couchbase'
import Consistency = SearchQuery.Consistency

const config = {
    uri: process.env.COUCHBASE_URI || 'couchbase://127.0.0.1?detailed_errcodes=1',
    bucketName: process.env.COUCHBASE_BUCKET || 'mkpremium',
    username: process.env.COUCHBASE_USER || 'couchbase',
    password: process.env.COUCHBASE_PASS || 'couchbase',
}


export function connectCouchbaseBucket() {
    const cluster = new Couchbase.Cluster(config.uri)
    cluster.authenticate(config.username, config.password)

    return new Promise((resolve, reject) => {
        const bucket = cluster.openBucket(config.bucketName)
        bucket.on('connect', () => resolve(bucket))
        bucket.on('error', error => reject(error))
    })
}
