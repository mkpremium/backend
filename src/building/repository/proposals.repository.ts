import { CouchbaseRepository } from '../../db/couchbase.repository'
import { ProposalProps } from '../building'

export class ProposalsRepository extends CouchbaseRepository<ProposalProps> {
  pendingToSend (): Promise<ProposalProps[]> {
    return Promise.reject(new Error('not implemented'))
  }
}
