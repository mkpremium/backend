import moment from 'moment'
import uuid from 'uuid/v4'
import { ScheduledEvent } from '../../scheduled-events/types'
import { ScheduledEventsRepository } from '../../scheduled-events/repository/schedule-events.repository'
import { CouchbaseDocumentType } from '../../infrastructure/postgres/couchbase-document.entity'
import { OfferRequestsRepository } from './offer-requests.repository'

const DbOfferRequest = ScheduledEvent

export class CouchbaseOfferRequestsRepository implements OfferRequestsRepository {
  constructor (private scheduledEventsRepository: ScheduledEventsRepository) {
  }

  async add (offer: {
    flipperId: string,
    callerId: string,
    ownerId: string,
    destinationContactId: string,
    worksheetId: string,
    buildingId: string
  }) {
    const now = moment().toDate()

    const scheduledEvent = DbOfferRequest({
      id: uuid(),
      _documentType: CouchbaseDocumentType.SCHEDULED_EVENT,
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
