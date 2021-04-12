import { AddMeetingService } from '../../../src/scheduled-events/service/add-meeting.service'
import { expect } from 'chai'
import { stub } from 'sinon'
import { InvalidCommand } from '../../../src/infrastructure/invalid-command.error'

describe('AddMeetingService', () => {
  let service
  let meetingsRepositorySpy
  let buildingsRepositorySpy

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
    meetingsRepositorySpy = {
      add: stub().resolves()
    }
    buildingsRepositorySpy = {
      assignBuildingToAgent: stub().resolves()
    }

    service = new AddMeetingService(meetingsRepositorySpy, buildingsRepositorySpy)
  })

  it('adds meeting in in repository', () => {
    return service.createMeeting(testCmd)
      .then(() => {
        expect(meetingsRepositorySpy.add).to.have.been.calledWith({
          buildingId: testCmd.buildingId,
          withAgentOfId: testCmd.notifyTo,
          meetingAt: testCmd.eventDate
        })
      })
  })

  it('assigns building to evaluator flipper', () => {
    return service.createMeeting(testCmd)
      .then(() => {
        expect(buildingsRepositorySpy.assignBuildingToAgent).to.have.been.calledWith(testCmd.notifyTo)
      })
  })

  it('fails on invalid command', () => {
    return expect(service.createMeeting({})).to.be.rejectedWith(InvalidCommand)
  })
})
