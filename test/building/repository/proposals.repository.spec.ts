import { ProposalsRepository } from '../../../src/building/repository/proposals.repository'
import { createTestContainer } from '../../create-test-container'
import { proposalBuilder } from '../proposal.builder'
import { ProposalProps } from '../../../src/building/building'
import { expect } from 'chai'

describe('ProposalsRepository', () => {
  let repository!: ProposalsRepository
  let proposalsToBeSend: ProposalProps[]
  const testPendingProposal = proposalBuilder({
    id: 'test-pending-proposal-id',
    notificationStatus: 'PENDING'
  }).build()

  before(async () => {
    const container = await createTestContainer()
    repository = container.resolve('proposalsRepository')

    await repository.save(testPendingProposal)
    proposalsToBeSend = await repository.pendingToSend()
  })

  it('returns all pending proposals', () => {
    expect(proposalsToBeSend[0].id).to.equal(testPendingProposal.id)
  })
})
