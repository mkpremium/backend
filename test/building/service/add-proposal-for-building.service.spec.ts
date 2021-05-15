import { expect } from 'chai'
import { stub } from 'sinon'
import { AddProposalForBuildingService } from '../../../src/building/service/add-proposal-for-building.service'

const testBuildingId = 'test-building-id'
const testOwnerId = 'test-owner-id'
const testProposalAmount = 100000
const testContactId = 'test-contact-id'
const testEmailMessage = 'email message'
const testFlipperId = 'test-flipper-id'

describe('AddProposalForBuildingService', () => {
  let service: AddProposalForBuildingService
  let legacyAddProposalServiceStub

  beforeEach(() => {
    legacyAddProposalServiceStub = {
      addProposal: stub()
    }
    service = new AddProposalForBuildingService(legacyAddProposalServiceStub)
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
          message: testEmailMessage,
        }
      )
    })
  })
})
