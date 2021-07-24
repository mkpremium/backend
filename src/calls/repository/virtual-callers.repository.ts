import { CouchbaseRepository } from '../../db/couchbase.repository'
import t, { Struct } from 'tcomb'
import { RecordToDomain } from '../../infrastructure/couchbase/record-to-domain'
import { VirtualCaller, VirtualCallerProps } from '../domain/virtual-caller'
import fromJSON from 'tcomb/lib/fromJSON'

const enabledCallersQuery = bucketName => `
    SELECT caller.*
    FROM ${bucketName} caller
    WHERE _documentType = 'virtual-caller'
      AND isEnabled
`

export class VirtualCallersRepository extends CouchbaseRepository<VirtualCallerProps> {
  protected struct (): Struct<any> & Partial<RecordToDomain> {
    return VirtualCaller
  }

  enabledCallers (): Promise<VirtualCallerProps[]> {
    return this.couchbaseAdapter.queryAsync(enabledCallersQuery(this.bucketName))
      .then(rows => fromJSON(rows, t.list(VirtualCaller)))
  }
}
