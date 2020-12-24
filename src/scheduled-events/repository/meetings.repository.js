import { CouchbaseRepository } from '../../db/couchbase.repository'
import t from 'tcomb'
import { Meeting } from '../domain/meeting'
import moment from 'moment'

const DbMeeting = t.struct({
  id: t.String,
  notifyTo: t.String,
  eventDate: t.Date,
  event: t.struct({
    buildingId: t.String
  }),
  _documentType: t.irreducible('MeetingDbDocumentType', dt => dt === 'scheduled-event')
}, {
  name: 'DbMeeting',
  defaultProps: {
    _documentType: 'scheduled-event'
  }
})

DbMeeting.prototype.couchbaseToDomain = function () {
  return Meeting({
    id: this.id,
    buildingId: this.event.buildingId,
    withAgentOfId: this.notifyTo,
    meetingAt: moment(this.eventDate)
  })
}

export class MeetingsRepository extends CouchbaseRepository {
  struct () {
    return DbMeeting
  }
}
