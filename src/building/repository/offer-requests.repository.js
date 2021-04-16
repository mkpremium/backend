import { CouchbaseRepository } from '../../db/couchbase.repository'
import { ScheduledEvent } from '../../scheduled-events/types'
import uuid from 'uuid/v4'
import moment from 'moment'

const DbOfferRequest = ScheduledEvent

export class OfferRequestsRepository extends CouchbaseRepository {
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

    await this.save(scheduledEvent)

    return { ...offer, id: scheduledEvent.id }
  }

  struct () {
    return DbOfferRequest
  }
}
