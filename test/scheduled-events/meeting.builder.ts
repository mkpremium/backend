import { MeetingProps, ScheduledEvent, ScheduledEventId } from '../../src/scheduled-events/types'
import moment from 'moment'

const meetingPrototype: MeetingProps = {
  id: 'test-meeting-id' as ScheduledEventId,
  type: 'MEETINGS',
  notifyTo: 'test-meeting-flipper-id',
  eventDate: moment().add(-1, 'day').format(),
  createdBy: 'test-meeting-flipper-id',
  createdAt: moment().add(-7, 'day').toDate(),
  event: {
    buildingId: 'test-meeting-building-id',
    ownerId: 'test-meeting-owner-id',
    contactId: 'test-meeting-contact-id',
    inPerson: true,
    worksheetId: 'test-meeting-worksheet-id'
  },
}

export const meetingBuilder = (overrides: Partial<MeetingProps> = {}) => ({
  build: () => ScheduledEvent({ ...meetingPrototype, ...overrides }) as MeetingProps
})
