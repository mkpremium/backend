import { expect } from 'chai'
import { initApplication } from '../../../test-e2e/helper/rest-api-helper'
import { MeetingsRepository } from '../../../src/scheduled-events/repository/meetings.repository'
import { Meeting } from '../../../src/scheduled-events/domain/meeting'
import moment from 'moment'

describe('MeetingsRepository', () => {
  let app
  let scheduledEventsRepository
  let repository

  beforeEach(async () => {
    app = await initApplication()
    scheduledEventsRepository = app.locals.legacyDependenciesContainer.scheduledEventsRepository
    repository = new MeetingsRepository(app.locals.dependenciesContainer.couchbaseAdapter)
  })

  it('gets meeting saved by scheduled events repository', async () => {
    const now = moment()
    const testScheduledEvent = {
      id: 'test-meeting-id',
      type: 'MEETINGS',
      notifyTo: 'test-agent-id',
      notifyAt: now.toDate(),
      eventDate: now.toDate(),
      event: {
        inPerson: false,
        buildingId: 'test-building-id'
      }
    }
    await scheduledEventsRepository.save(testScheduledEvent)

    const fetchedMeeting = await repository.get('test-meeting-id')

    expect(fetchedMeeting).not.to.be.undefined
    expect(Meeting.is(fetchedMeeting)).to.be.true
    expect(fetchedMeeting).to.be.eql({
      id: testScheduledEvent.id,
      buildingId: testScheduledEvent.event.buildingId,
      withAgentOfId: testScheduledEvent.notifyTo,
      meetingAt: moment(testScheduledEvent.eventDate)
    })
  })
})
