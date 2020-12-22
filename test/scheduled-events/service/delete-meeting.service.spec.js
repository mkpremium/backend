import { expect } from 'chai'
import { DeleteMeetingService } from '../../../src/scheduled-events/service/delete-meeting.service'
import { spy, stub } from 'sinon'
import moment from 'moment'

describe('DeleteMeetingService', () => {
  const testUser = { id: 'test-user-id' }
  let service
  let meetingRepositoryMock
  let eventBusMock

  beforeEach(() => {
    meetingRepositoryMock = {
      get: stub(),
      delete: stub()
    }
    eventBusMock = {
      publish: spy()
    }
    meetingRepositoryMock.get.withArgs('test-meeting-id').resolves({
      id: 'test-meeting-id',
      buildingId: 'test-meeting-building-id',
      meetingAt: moment('2020-11-14T08:00:00.000Z')
    })
    service = new DeleteMeetingService(meetingRepositoryMock, eventBusMock)
  })

  it('deletes meeting from repository', async () => {
    await service.deleteMeeting('test-meeting-id', testUser)

    expect(meetingRepositoryMock.delete).to.have.been.calledWith('test-meeting-id')
  })

  it('publish event with event and user information', async () => {
    await service.deleteMeeting('test-meeting-id', testUser)

    expect(eventBusMock.publish).to.have.been.calledWith({
      name: 'meeting.deleted',
      meetingId: 'test-meeting-id',
      byUserOfId: testUser.id,
      meetingAt: '2020-11-14T08:00:00.000Z',
      buildingId: 'test-meeting-building-id'
    })
  })
})
