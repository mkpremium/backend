import { CouchbaseRepository } from '../db/couchbase.repository'
import { RecordToDomain } from '../infrastructure/couchbase/record-to-domain'
import { Struct } from 'tcomb'
import { User, UserProps } from '../types/user'
import * as TE from 'fp-ts/TaskEither'

export class UsersRepository extends CouchbaseRepository<UserProps> {
  protected struct (): Struct<any> & Partial<RecordToDomain> {
    return User
  }

  withFavoriteBuilding (buildingId: string): TE.TaskEither<Error, UserProps | undefined> {
    throw new Error('not implemented')
  }
}
