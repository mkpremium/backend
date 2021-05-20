import couchbase from '../src/db/legacy-connect-couchbase'
import { createDiContainer } from '../src/infrastructure/dependencies'
import { N1qlQuery } from 'couchbase'

export const createTestContainer = () => {
  return couchbase()
    .then(bucket => Promise.all([
      new Promise((resolve, reject) => {
        bucket.query(N1qlQuery.fromString(`DELETE FROM ${bucket.name}`), (error) => {
          if (error) {
            reject(error)
          } else {
            resolve(undefined)
          }
        })
      }),
      createDiContainer(bucket)
    ]))
    .then(([ _, container ]) => container)
}
