import { AddEvaluationRequestService } from '../../../src/scheduled-events/service/add-evaluation-request.service'
import { expect } from 'chai'
import { stub } from 'sinon'
import { InvalidCommand } from '../../../src/infrastructure/invalid-command.error'

describe('AddEvaluationRequestService', () => {
  let service
  let evaluationRequestsRepositoryStub
  let buildingsRepositoryStub

  const testCmd = {
    ownerId: 'owner-id',
    destinationContactId: 'email-contact-id',
    reporterContactId: 'phone-reporter-contact-id',
    buildingId: 'building-id',
    flipperId: 'flipper-id',
    worksheetId: 'worksheet-id'
  }

  beforeEach(() => {
    evaluationRequestsRepositoryStub = {
      add: stub().resolves()
    }
    buildingsRepositoryStub = {
      assignBuildingToAgent: stub().resolves()
    }

    service = new AddEvaluationRequestService(
      evaluationRequestsRepositoryStub,
      buildingsRepositoryStub
    )
  })

  it('adds evaluation request to repository', () => {
    return service.addEvaluationRequest(testCmd)
      .then(() => {
        expect(evaluationRequestsRepositoryStub.add).to.have.been.calledWith(testCmd)
      })
  })

  it('assigns building to evaluator flipper', () => {
    return service.addEvaluationRequest(testCmd)
      .then(() => {
        expect(buildingsRepositoryStub.assignBuildingToAgent).to.have.been.calledWith(testCmd.notifyTo)
      })
  })

  it('fails on invalid command', () => {
    return expect(service.addEvaluationRequest({})).to.be.rejectedWith(InvalidCommand)
  })
})
