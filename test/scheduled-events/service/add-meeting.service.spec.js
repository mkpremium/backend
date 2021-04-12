import { AddMeetingService } from '../../../src/scheduled-events/service/add-meeting.service'
import { expect } from 'chai'
import { spy } from 'sinon'
import { InvalidCommand } from '../../../src/infrastructure/invalid-command.error'

describe('AddMeetingService', () => {
  let service
  let meetingsRepositorySpy

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
      add: spy()
    }

    service = new AddMeetingService(meetingsRepositorySpy)
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

  it('fails on invalid command', () => {
    return expect(service.createMeeting({})).to.be.rejectedWith(InvalidCommand)
  })
})
