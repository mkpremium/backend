import { expect } from 'chai'
import { stub } from 'sinon'
import { AddProposalForBuildingService } from '../../../src/building/service/add-proposal-for-building.service'
import { ownerBuilder } from '../../owner/owner.builder'

const testBuildingId = 'test-building-id'
const testOwnerId = 'test-owner-id'
const testProposalAmount = 100000
const testContactId = 'test-contact-id'
const testEmailMessage = 'email message'
const testFlipperId = 'test-flipper-id'
const testNotificationEmailAddress = 'notification@address.email'
const testOwner = ownerBuilder({ id: testOwnerId })
  .withEmailContact(testContactId, 'GOOD', testNotificationEmailAddress).build()

describe('AddProposalForBuildingService', () => {
  let service: AddProposalForBuildingService
  let legacyAddProposalServiceStub
  let ownersRepositoryStub
  let eventBusStub

  beforeEach(async () => {
    legacyAddProposalServiceStub = {
      addProposal: stub().resolves()
    }
    ownersRepositoryStub = {
      get: stub().withArgs(testOwnerId).resolves(testOwner)
    }
    eventBusStub = {
      publish: stub().resolves()
    }

    service = new AddProposalForBuildingService(
      legacyAddProposalServiceStub,
      ownersRepositoryStub,
      eventBusStub,
    )

    await service.add(testBuildingId, {
      ownerId: testOwnerId,
      contactId: testContactId,
      amount: testProposalAmount,
      createdBy: testFlipperId,
      message: testEmailMessage,
    })
  })

  it('adds proposal to building', () => {
    expect(legacyAddProposalServiceStub.addProposal).to.have.been.calledWith(
      testBuildingId, testFlipperId, {
        state: 'pendiente',
        ownerId: testOwnerId,
        proposal: testProposalAmount,
        notificationStatus: 'PENDING',
        notificationEmail: testNotificationEmailAddress,
        message: testEmailMessage,
      }
    )
  })

  it('publishes proposal added event', () => {
    expect(eventBusStub.publish).to.have.been.calledWith({
      name: 'building.proposal_scheduled',
      buildingId: testBuildingId,
      createdBy: testFlipperId,
      ownerId: testOwnerId
    })
  })
})
