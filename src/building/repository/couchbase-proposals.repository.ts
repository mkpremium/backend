import { CouchbaseRepository } from '../../db/couchbase.repository'
import { BuildingProposal, ProposalProps } from '../building'
import t, { Struct } from 'tcomb'
import { RecordToDomain } from '../../infrastructure/couchbase/record-to-domain'
import fromJSON from 'tcomb/lib/fromJSON'
import { ProposalsRepository } from './proposals.repository'

const pendingProposalToSendQuery = bucketName => `
    SELECT proposal.*
    FROM ${bucketName} proposal
    WHERE _documentType = 'building-proposal'
      AND notificationStatus = 'PENDING'
`

export class CouchbaseProposalsRepository extends CouchbaseRepository<ProposalProps> implements ProposalsRepository {
  pendingProposals (): Promise<ProposalProps[]> {
    return this.couchbaseAdapter.queryAsync(pendingProposalToSendQuery(this.bucketName))
      .then(rows => fromJSON(rows, t.list(this.struct())))
  }

  protected struct () {
    return BuildingProposal as Struct<ProposalProps> & RecordToDomain
  }
}
