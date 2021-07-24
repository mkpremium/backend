import { CouchbaseRepository } from '../../db/couchbase.repository'
import { Struct } from 'tcomb'
import { RecordToDomain } from '../../infrastructure/couchbase/record-to-domain'
import { VirtualCaller, VirtualCallerProps } from '../domain/virtual-caller'

export class VirtualCallersRepository extends CouchbaseRepository<VirtualCallerProps> {
  protected struct (): Struct<any> & Partial<RecordToDomain> {
    return VirtualCaller
  }
}
