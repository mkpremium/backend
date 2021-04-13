import { CouchbaseRepository } from '../../db/couchbase.repository'
import { ScheduledEvent } from '../../scheduled-events/types'
import uuid from 'uuid/v4'
import moment from 'moment'

const DbEvaluationRequest = ScheduledEvent

export class EvaluationRequestsRepository extends CouchbaseRepository {
  async add (evaluation) {
    const now = moment().toDate()
    const scheduledEvent = DbEvaluationRequest({
      id: uuid(),
      type: 'MEETINGS',
      notifyTo: evaluation.flipperId,
      eventDate: now,
      createdBy: evaluation.callerId,
      createdAt: now,
      event: {
        ownerId: evaluation.ownerId,
        contactId: evaluation.destinationContactId,
        worksheetId: evaluation.worksheetId,
        buildingId: evaluation.buildingId,
        inPerson: false
      }
    })

    return this.save(scheduledEvent)
  }

  struct () {
    return DbEvaluationRequest
  }
}
