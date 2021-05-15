import { expect } from 'chai'
import { createTestApp } from '../create-test-app'
import { ownerBuilder } from '../../owner/owner.builder'
import { buildingBuilder } from '../../building/building.builder'
import { AddProposalForBuildingService } from '../../../src/building/service/add-proposal-for-building.service'
import { BuildingsRepository } from '../../../src/building/repository/buildings.repository'
import { OwnerRepository } from '../../../src/owner/repository/owner.repository'
import { LegacyBuildingRepository } from '../../../src/building/models'

describe('AddProposalForBuilding', () => {
  let addProposalForBuildingService: AddProposalForBuildingService
  let ownersRepository: OwnerRepository
  let buildingsRepository: BuildingsRepository
  let legacyBuildingsRepository: LegacyBuildingRepository

  const testCmd = {
    buildingId: 'test-building-id',
    ownerId: 'test-owner-id',
    amount: 1000,
    contactId: 'test-email-contact-id',
    createdBy: 'test-flipper-id',
    message: 'test email message'
  }

  before(async () => {
    const { locals: { diContainer } } = await createTestApp()
    addProposalForBuildingService = diContainer.resolve('addProposalForBuildingService')

    ownersRepository = diContainer.resolve('ownersRepository')
    buildingsRepository = diContainer.resolve('buildingsRepository')
    legacyBuildingsRepository = diContainer.resolve('legacyBuildingsRepository')

    await ownersRepository.save(ownerBuilder({ id: testCmd.ownerId })
      .withEmailContact(testCmd.contactId)
      .build()
    )
    await buildingsRepository.save(buildingBuilder({ id: testCmd.buildingId }).build())
    await addProposalForBuildingService.add(testCmd.buildingId, testCmd)
  })

  it('saves proposal for building', () => {
    return legacyBuildingsRepository.listProposalsForBuilding(testCmd.buildingId)
      .then(proposals => {
        expect(proposals).to.have.lengthOf(1)
        expect(proposals[0]).to.be.deep.contains({
          ownerId: testCmd.ownerId,
          buildingId: testCmd.buildingId,
          createdBy: testCmd.createdBy,
          proposal: testCmd.amount
        })
      })
  })
})
