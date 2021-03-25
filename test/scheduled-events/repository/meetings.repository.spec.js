import { expect } from 'chai'
import { MeetingsRepository } from '../../../src/scheduled-events/repository/meetings.repository'
import { Meeting } from '../../../src/scheduled-events/domain/meeting'
import moment from 'moment'
import { createTestContainer } from '../../create-test-container'

describe('MeetingsRepository', () => {
  let scheduledEventsRepository
  let repository

  beforeEach(async () => {
    const container = await createTestContainer()
    scheduledEventsRepository = container.resolve('scheduledEventsRepository')
    repository = new MeetingsRepository(container.resolve('couchbaseAdapter'))
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
        inPerson: true,
        buildingId: 'test-building-id',
        ownerId: 'test-owner-id',
        contactId: 'test-contact-id'
      }
    }
    await scheduledEventsRepository.save(testScheduledEvent)

    const fetchedMeeting = await repository.get('test-meeting-id')

    expect(fetchedMeeting).not.to.be.undefined
    expect(fetchedMeeting).to.be.eql(Meeting({
      id: testScheduledEvent.id,
      buildingId: testScheduledEvent.event.buildingId,
      withAgentOfId: testScheduledEvent.notifyTo,
      meetingAt: moment(testScheduledEvent.eventDate)
    }))
  })

  describe('futureMeetingsFor', () => {
    it('returns  only future meetigs for user', async () => {
      const pastMeeting = Meeting({
        id: 'test-past-meeting',
        buildingId: 'test-building-id',
        withAgentOfId: 'test-user-id',
        meetingAt: moment().add(-1, 'minute')
      })
      const futureMeeting = Meeting({
        id: 'test-future-meeting',
        buildingId: 'test-building-id',
        withAgentOfId: 'test-user-id',
        meetingAt: moment().add(1, 'minute')
      })
      await Promise.all([ repository.save(pastMeeting), repository.save(futureMeeting) ])

      return repository.futureMeetingsFor('test-user-id')
        .then(result => {
          expect(result).to.have.length(1)
          expect(result[ 0 ].id).to.be.equal('test-future-meeting')
        })
    })
  })
})
