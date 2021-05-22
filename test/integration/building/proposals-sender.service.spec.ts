import { ProposalsSenderService } from '../../../src/building/service/proposals-sender.service'
import { createTestContainer } from '../../create-test-container'
import { stub } from 'sinon'
import { asValue } from 'awilix'
import { expect } from 'chai'
import { BuildingProposal } from '../../../src/building/building'
import { buildingBuilder } from '../../building/building.builder'
import { AddProposalForBuildingService } from '../../../src/building/service/add-proposal-for-building.service'
import { ownerBuilder } from '../../owner/owner.builder'
import { OwnerRepository } from '../../../src/owner/repository/owner.repository'
import { BuildingsRepository } from '../../../src/building/repository/buildings.repository'

describe('ProposalsSenderService', () => {
  let service!: ProposalsSenderService
  let addProposalForBuildingService!: AddProposalForBuildingService
  let mailerSpy
  const testBuilding = buildingBuilder().build()
  const testOwner = ownerBuilder({ buildingId: testBuilding.id }).withEmailContact('test-email-id').build()

  beforeEach(async () => {
    const container = await createTestContainer()
    mailerSpy = {
      sendMail: stub()
    }
    container.register('mailer', asValue(mailerSpy))

    service = container.resolve('proposalsSenderService')
    addProposalForBuildingService = container.resolve('addProposalForBuildingService')

    const buildingsRepository = container.resolve('buildingsRepository') as BuildingsRepository
    const ownersRepository = container.resolve('ownersRepository') as OwnerRepository
    await ownersRepository.save(testOwner)
    await buildingsRepository.save(testBuilding)
  })

  it('sends emails older than 3 days', () => {
    const testProposalToBeSend = BuildingProposal({
      ownerId: 'test-owner-id',
      buildingId: testBuilding.id,
      createdBy: 'test-caller-id',

      proposal: 10000,
      message: 'test email message',
      notificationStatus: 'PENDING',
      notificationEmail: 'owner@test.email',
    })

    mailerSpy.sendMail.resolves()
    const testAddProposalCmd = {
      amount: 100000,
      ownerId: testOwner.id,
      contactId: 'test-email-id',
      createdBy: 'test-caller-id',
    }

    return addProposalForBuildingService.add(testBuilding.id, testAddProposalCmd)
      .then(() => service.checkAndSendProposals())
      .then(() => {
        expect(mailerSpy.sendMail).to.have.been.called
      })
  })
})
