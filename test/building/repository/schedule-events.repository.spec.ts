import { ScheduledEventsRepository } from '../../../src/scheduled-events/repository/schedule-events.repository'
import { createTestContainer } from '../../create-test-container'
import moment from 'moment'
import { meetingBuilder } from '../../scheduled-events/meeting.builder'
import { expect } from 'chai'

describe('ScheduledEventsRepository', () => {
  let repository!: ScheduledEventsRepository

  beforeEach(async () => {
    const container = await createTestContainer({couchbase: true, postgres: false})
    repository = container.resolve('scheduledEventsRepository')
  })

  it('gives latest building scheduled event', async () => {
    const testMeeting = meetingBuilder({
      eventDate: moment().add(-1, 'day').format(),
      createdAt: moment().add(-7, 'day').toDate(),
    }).build()
    await repository.save(testMeeting)

    const latestBuildingMeeting = await repository.lastScheduledEventForBuilding(testMeeting.event.buildingId)

    expect(latestBuildingMeeting).to.be.ok
  })
})
