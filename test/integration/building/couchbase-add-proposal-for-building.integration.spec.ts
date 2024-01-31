import { expect } from 'chai'
import { createTestApp } from '../create-test-app'
import { ownerBuilder } from '../../owner/owner.builder'
import { buildingBuilder } from '../../building/building.builder'
import { AddProposalForBuildingService } from '../../../src/building/service/add-proposal-for-building.service'
import { BuildingsRepository } from '../../../src/building/repository/buildings.repository'
import { OwnerRepository } from '../../../src/owner/repository/owner.repository'
import moment from 'moment'
import { contactOfId } from '../../../src/owner/owner'
import { BuildingsReadRepository } from '../../../src/building/repository/buildings-read.repository'

describe('AddProposalForBuilding - Integration (Couchbase)', () => {
  let addProposalForBuildingService: AddProposalForBuildingService
  let ownersRepository: OwnerRepository
  let buildingsRepository: BuildingsRepository
  let buildingsReadRepository: BuildingsReadRepository

  const testCmd = {
    buildingId: 'test-building-id',
    ownerId: 'test-owner-id',
    amount: 1000,
    contactId: 'test-email-contact-id',
    createdBy: 'test-flipper-id',
    message: 'test email message'
  }
  const testOwner = ownerBuilder({ id: testCmd.ownerId })
    .withEmailContact(testCmd.contactId)
    .build()

  beforeEach(async () => {
    const { locals: { diContainer } } = await createTestApp()

    addProposalForBuildingService = diContainer.resolve('addProposalForBuildingService')
    ownersRepository = diContainer.resolve('ownersRepository')
    buildingsRepository = diContainer.resolve('buildingsRepository')

    buildingsReadRepository = diContainer.resolve('buildingsReadRepository')
  })

  it('saves proposal for building', async () => {
    await ownersRepository.save(testOwner)
    await buildingsRepository.save(buildingBuilder({ id: testCmd.buildingId }).build())
    await addProposalForBuildingService.add(testCmd.buildingId, testCmd)

    const proposals = await buildingsReadRepository.listProposalsForBuilding(testCmd.buildingId)
    expect(proposals).to.have.lengthOf(1)
    expect(proposals[0]).to.be.deep.contains({
      ownerId: testCmd.ownerId,
      createdBy: testCmd.createdBy,
      proposal: testCmd.amount,
      message: testCmd.message,
      notificationStatus: 'PENDING',
      notificationEmail: contactOfId(testOwner, testCmd.contactId).value
    })
    expect(moment((proposals[0] as any).createdAt).isSame(moment(), 'day'))
      .to.be.true
  })
})
