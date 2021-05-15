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

  beforeEach(() => {
    legacyAddProposalServiceStub = {
      addProposal: stub()
    }
    ownersRepositoryStub = {
      get: stub()
    }
    ownersRepositoryStub.get.withArgs(testOwnerId).resolves(testOwner)

    service = new AddProposalForBuildingService(
      legacyAddProposalServiceStub,
      ownersRepositoryStub
    )
  })

  it('adds proposal to building', () => {
    legacyAddProposalServiceStub.addProposal.resolves()

    return service.add(testBuildingId, {
      ownerId: testOwnerId,
      contactId: testContactId,
      amount: testProposalAmount,
      createdBy: testFlipperId,
      message: testEmailMessage,
    }).then(() => {
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
  })
})
