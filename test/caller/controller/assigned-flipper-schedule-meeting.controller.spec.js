import { spy, stub } from 'sinon'
import { expect } from 'chai'
import moment from 'moment'
import {
  createAssignedFlipperScheduleMeetingController
} from '../../../src/caller/controller/assigned-flipper-schedule-meeting.controller'
import { ClientError } from '../../../src/infrastructure/http'

describe('Assigned Flipper Schedule Meeting Controller', () => {
  it('schedules meeting for assigned flipper', () => {
    const createMeetingSpy = stub().resolves(undefined)

    const controller = createAssignedFlipperScheduleMeetingController({
      createMeetingService: {
        createMeeting: createMeetingSpy
      }
    })

    const testCallerId = 'test-caller-id'
    const testAssignedFlipperId = 'test-assigned-flipper-id'
    const testMeetingAt = moment().toISOString()
    const testRequest = {
      user: {
        id: testCallerId,
        flipperId: testAssignedFlipperId,
        operator: {}
      },
      body: {
        meetingAt: testMeetingAt,
        contactId: 'test-contact-id',
        eventAddress: 'test meeting adddress',
        ownerId: 'test-owner-id',
        worksheetId: 'test-worksheet-id',
        buildingId: 'test-building-id'
      }
    }
    const testResponse = {
      status: spy(),
      json: spy()
    }

    return controller(testRequest, testResponse).then(() => {
      const expectedCreateMeetingCommand = {
        createdBy: testCallerId,
        notifyTo: testAssignedFlipperId,
        event: {
          contactId: 'test-contact-id',
          eventAddress: 'test meeting adddress',
          ownerId: 'test-owner-id',
          worksheetId: 'test-worksheet-id',
          buildingId: 'test-building-id'
        },
        notifyAt: testMeetingAt,
        eventDate: testMeetingAt
      }
      expect(createMeetingSpy).to.have.been.calledWith(testRequest.user.operator, expectedCreateMeetingCommand)
      expect(testResponse.status).to.have.been.calledWith(201)
    })
  })

  it('returns client error on bad request body', () => {
    const controller = createAssignedFlipperScheduleMeetingController({})

    const testCallerId = 'test-caller-id'
    const testAssignedFlipperId = 'test-assigned-flipper-id'
    const testRequest = {
      user: {
        id: testCallerId,
        flipperId: testAssignedFlipperId,
        operator: {}
      },
      body: {}
    }
    const testResponse = {
      status: spy(),
      json: spy()
    }

    expect(() => controller(testRequest, testResponse)).to.throws(ClientError)
  })
})
