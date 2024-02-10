import { ProposalsRepository } from '../../../src/building/repository/proposals.repository'
import { createTestContainer } from '../../create-test-container'
import { proposalBuilder } from '../proposal.builder'
import { expect } from 'chai'
import { BuildingsRepository } from '../../../src/building/repository/buildings.repository'
import { buildingBuilder } from '../building.builder'
import uuid from 'uuid/v4'
import { ownerBuilder } from '../../owner/owner.builder'
import { OwnerRepository } from '../../../src/owner/repository/owner.repository'
import { Factory } from 'rosie'
import { DataSource } from 'typeorm'
import { User } from '../../../src/user/user.entity'

describe('ProposalsRepository(Postgres)', () => {
  it('returns all pending proposals', async () => {
    const container = await createTestContainer()
    const proposalsRepository = container.resolve('proposalsRepository') as ProposalsRepository
    const buildingsRepository = container.resolve('buildingsRepository') as BuildingsRepository
    const ownersRepository = container.resolve('ownersRepository') as OwnerRepository
    const ormDataSource = container.resolve('ormDataSource') as DataSource

    const testBuilding = await buildingsRepository.save(buildingBuilder().build())
    const testOwner = await ownersRepository.save(ownerBuilder().build())
    const testUser = await ormDataSource.getRepository(User).save(
      Factory.build('user', { username: 'flipper-username' }))
    const testPendingProposal = proposalBuilder({
      id: uuid(),
      buildingId: testBuilding.id,
      ownerId: testOwner.id,
      createdBy: testUser.id,
      notificationStatus: 'PENDING'
    }).build()

    await proposalsRepository.save(testPendingProposal)
    const proposalsToBeSend = await proposalsRepository.pendingProposals()

    expect(proposalsToBeSend[0].id).to.equal(testPendingProposal.id)
  })
})
