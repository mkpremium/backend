import { CouchbaseRepository } from '../db/couchbase.repository'
import { RecordToDomain } from '../infrastructure/couchbase/record-to-domain'
import { Struct } from 'tcomb'
import { User, UserProps } from '../types/user'
import * as TE from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/function'
import { fromPromise } from '../infrastructure/fp-utils'
import { map } from 'fp-ts/TaskEither'
import fromJSON from 'tcomb/lib/fromJSON'

export class UsersRepository extends CouchbaseRepository<UserProps> {
  protected struct (): Struct<any> & Partial<RecordToDomain> {
    return User
  }

  withFavoriteBuilding (buildingId: string): TE.TaskEither<Error, UserProps | undefined> {
    const query = `
        SELECT flipper.*
        FROM ${this.bucketName} flipper
        WHERE flipper._documentType = 'operator'
            AND $1 IN favoriteBuildings
    `
    return pipe(
      fromPromise(this.couchbaseAdapter.queryAsync(query, [buildingId])),
      map(rows => {
        if (rows.length === 0) {
          return undefined
        }

        return fromJSON(rows[0], User)
      })
    )
  }
}
