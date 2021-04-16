import { AddEvaluationRequestService } from '../../../src/building/service/add-evaluation-request.service'
import { expect } from 'chai'
import { stub, spy } from 'sinon'
import { InvalidCommand } from '../../../src/infrastructure/invalid-command.error'

describe('AddEvaluationRequestService', () => {
  let service
  let evaluationRequestsRepositoryStub
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
    evaluationRequestsRepositoryStub = {
      add: stub().resolves()
    }
    buildingsRepositoryStub = {
      assignBuildingToAgent: stub().resolves()
    }
    eventBusSpy = {
      publish: spy()
    }

    service = new AddEvaluationRequestService(
      evaluationRequestsRepositoryStub,
      buildingsRepositoryStub,
      eventBusSpy
    )
  })

  it('adds evaluation request to repository', () => {
    return service.addOfferRequest(testCmd)
      .then(() => {
        expect(evaluationRequestsRepositoryStub.add).to.have.been.calledWith(testCmd)
      })
  })

  it('assigns building to evaluator flipper', () => {
    return service.addOfferRequest(testCmd)
      .then(() => {
        expect(buildingsRepositoryStub.assignBuildingToAgent).to.have.been.calledWith(testCmd.buildingId, testCmd.flipperId)
      })
  })

  it('publishes event when done', () => {
    const storedEvaluationRequest = {}
    evaluationRequestsRepositoryStub.add.resolves(storedEvaluationRequest)

    return service.addOfferRequest(testCmd)
      .then(() => {
        expect(eventBusSpy.publish).to.have.been.calledWith({
          name: 'evaluation-request.created',
          note: testCmd.note,
          userId: testCmd.callerId,
          buildingId: testCmd.buildingId,
          request: storedEvaluationRequest
        })
      })
  })

  it('fails on invalid command', () => {
    return expect(service.addOfferRequest({})).to.be.rejectedWith(InvalidCommand)
  })
})
