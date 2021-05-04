import moment from 'moment'
import uuid from 'uuid/v4'
import { ScheduledEvent } from '../../scheduled-events/types'

const DbOfferRequest = ScheduledEvent

export class OfferRequestsRepository {
  /**
   * @param {ScheduledEventsRepository} scheduledEventsRepository
   */
  constructor (scheduledEventsRepository) {
    this.scheduledEventsRepository = scheduledEventsRepository
  }

  async add (offer) {
    const now = moment().toDate()

    const scheduledEvent = DbOfferRequest({
      id: uuid(),
      type: 'MEETINGS',
      notifyTo: offer.flipperId,
      eventDate: now,
      createdBy: offer.callerId,
      createdAt: now,
      event: {
        ownerId: offer.ownerId,
        contactId: offer.destinationContactId,
        worksheetId: offer.worksheetId,
        buildingId: offer.buildingId,
        inPerson: false
      }
    })

    await this.scheduledEventsRepository.addScheduledMeetingEvent(scheduledEvent, offer.callerId)

    return { ...offer, id: scheduledEvent.id }
  }

  struct () {
    return DbOfferRequest
  }
}
