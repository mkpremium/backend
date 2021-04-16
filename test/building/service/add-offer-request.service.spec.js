import { AddOfferRequestService } from '../../../src/building/service/add-offer-request.service'
import { expect } from 'chai'
import { stub, spy } from 'sinon'
import { InvalidCommand } from '../../../src/infrastructure/invalid-command.error'

describe('addOfferRequestService', () => {
  let service
  let offerRequestsRepositoryStub
  let buildingsRepositoryStub
  let eventBusSpy

  const testCmd = {
    ownerId: 'owner-id',
    destinationContactId: 'email-contact-id',
    reporterContactId: 'phone-reporter-contact-id',
    buildingId: 'building-id',
    flipperId: 'flipper-id',
    callerId: 'caller-id',
    worksheetId: 'worksheet-id',
    note: 'test-note'
  }

  beforeEach(() => {
    offerRequestsRepositoryStub = {
      add: stub().resolves()
    }
    buildingsRepositoryStub = {
      assignBuildingToAgent: stub().resolves()
    }
    eventBusSpy = {
      publish: spy()
    }

    service = new AddOfferRequestService(
      offerRequestsRepositoryStub,
      buildingsRepositoryStub,
      eventBusSpy
    )
  })

  it('adds offer request to repository', () => {
    return service.addOfferRequest(testCmd)
      .then(() => {
        expect(offerRequestsRepositoryStub.add).to.have.been.calledWith(testCmd)
      })
  })

  it('assigns building to evaluator flipper', () => {
    return service.addOfferRequest(testCmd)
      .then(() => {
        expect(buildingsRepositoryStub.assignBuildingToAgent).to.have.been.calledWith(testCmd.buildingId, testCmd.flipperId)
      })
  })

  it('publishes event when done', () => {
    const storedOfferRequest = {}
    offerRequestsRepositoryStub.add.resolves(storedOfferRequest)

    return service.addOfferRequest(testCmd)
      .then(() => {
        expect(eventBusSpy.publish).to.have.been.calledWith({
          name: 'offer-request.created',
          note: testCmd.note,
          userId: testCmd.callerId,
          buildingId: testCmd.buildingId,
          request: storedOfferRequest
        })
      })
  })

  it('fails on invalid command', () => {
    return expect(service.addOfferRequest({})).to.be.rejectedWith(InvalidCommand)
  })
})
