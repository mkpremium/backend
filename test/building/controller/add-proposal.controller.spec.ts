import { expect } from 'chai'
import { stub } from 'sinon'
import { createAddProposalController } from '../../../src/building/controller/add-proposal.controller'

const testBuildingId = 'test-building-id'
const testOwnerId = 'test-owner-id'
const testProposalAmount = 100000
const testContactId = 'test-contact-id'
const testEmailMessage = 'email message'

const testFlipperId = 'test-flipper-id'
describe('add-proposal.controller', () => {
  let controller
  let addProposalForBuildingServiceSpy

  beforeEach(() => {
    addProposalForBuildingServiceSpy = {
      add: stub()
    }
    controller = createAddProposalController({
      addProposalForBuildingService: addProposalForBuildingServiceSpy
    })
  })

  it('add proposal for building', () => {
    const testRequest = {
      params: { buildingId: testBuildingId },
      user: { id: testFlipperId },
      body: {
        ownerId: testOwnerId,
        amount: testProposalAmount,
        contactId: testContactId,
        message: testEmailMessage
      }
    }
    const testResponse = {
      status: stub().returnsThis(),
      json: stub().resolves()
    }
    addProposalForBuildingServiceSpy.add.resolves()

    return controller(testRequest, testResponse)
      .then(() => {
        expect(addProposalForBuildingServiceSpy.add).to.have.been
          .calledWith(testBuildingId, {
            ownerId: testOwnerId,
            createdBy: testFlipperId,
            amount: testProposalAmount,
            contactId: testContactId,
            message: testEmailMessage
          })
        expect(testResponse.status).to.have.been.calledWith(201)
        expect(testResponse.json).to.have.been.calledWith()
      })
  })
})
