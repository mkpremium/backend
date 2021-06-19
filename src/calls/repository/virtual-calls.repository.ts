import { CouchbaseRepository } from '../../db/couchbase.repository'
import { VirtualAgentCall, VirtualAgentCallProps } from '../virtual-agent-call'
import { Struct } from 'tcomb'
import { RecordToDomain } from '../../infrastructure/couchbase/record-to-domain'

export class VirtualCallsRepository extends CouchbaseRepository<VirtualAgentCallProps> {
  protected struct (): Struct<any> & Partial<RecordToDomain> {
    return VirtualAgentCall;
  }
}
