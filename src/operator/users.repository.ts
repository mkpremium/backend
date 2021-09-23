import { CouchbaseRepository } from '../db/couchbase.repository'
import { RecordToDomain } from '../infrastructure/couchbase/record-to-domain'
import { Struct } from 'tcomb'
import { User, UserProps } from '../types/user'

export class UsersRepository extends CouchbaseRepository<UserProps>{
  protected struct (): Struct<any> & Partial<RecordToDomain> {
    return User;
  }
}
