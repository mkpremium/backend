import { AddEvaluationRequestService } from '../../../src/scheduled-events/service/add-evaluation-request.service'
import { expect } from 'chai'
import { stub } from 'sinon'
import { InvalidCommand } from '../../../src/infrastructure/invalid-command.error'

describe('AddEvaluationRequestService', () => {
  let service
  let evaluationRequestsRepositoryStub
  let buildingsRepositoryStub

  const testCmd = {
    type: 'MEETINGS',
    event: {
      ownerId: 'owner-id',
      contactId: 'contact-id'
    },
    reporterContactId: 'reporter-contact-id',
    buildingId: 'building-id',
    notifyTo: 'flipper-id',
    eventDate: '2021-04-12T18:20:22.000Z'
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
        expect(evaluationRequestsRepositoryStub.add).to.have.been.calledWith({
          buildingId: testCmd.buildingId,
          withAgentOfId: testCmd.notifyTo,
          meetingAt: testCmd.eventDate
        })
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
