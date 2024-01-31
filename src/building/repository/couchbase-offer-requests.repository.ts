import moment from 'moment'
import uuid from 'uuid/v4'
import { ScheduledEvent } from '../../scheduled-events/types'
import { CouchbaseDocumentType } from '../../infrastructure/postgres/couchbase-document.entity'
import {
  CouchbaseScheduledEventsRepository
} from '../../scheduled-events/repository/couchbase-schedule-events.repository'
import { AddBuildingOfferCommand } from '../service/add-offer-request.service'

const DbOfferRequest = ScheduledEvent

export class CouchbaseOfferRequestsRepository {
  constructor (private couchbaseScheduledEventsRepository: CouchbaseScheduledEventsRepository) {
  }

  async add (offer: AddBuildingOfferCommand): Promise<AddBuildingOfferCommand & {id: string}> {
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

    await this.couchbaseScheduledEventsRepository.addScheduledMeetingEvent(scheduledEvent, offer.callerId)

    return { ...offer, id: scheduledEvent.id }
  }

  struct () {
    return DbOfferRequest
  }
}
