import moment from 'moment'
import t from 'tcomb'
import fromJSON from 'tcomb/lib/fromJSON'
import { CouchbaseRepository } from '../../db/couchbase.repository'
import { Meeting } from '../domain/meeting'

const DbMeeting = t.struct({
  id: t.String,
  notifyTo: t.String,
  eventDate: t.Date,
  event: t.struct({
    buildingId: t.String,
    inPerson: t.Boolean
  }),
  type: t.irreducible('MeetingDbEventType', dt => dt === 'MEETINGS'),
  _documentType: t.irreducible('MeetingDbDocumentType', dt => dt === 'scheduled-event')
}, {
  name: 'DbMeeting',
  defaultProps: {
    type: 'MEETINGS',
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

DbMeeting.fromMeeting = meeting => DbMeeting({
  id: meeting.id,
  notifyTo: meeting.withAgentOfId,
  eventDate: meeting.meetingAt.toDate(),
  event: {
    buildingId: meeting.buildingId,
    inPerson: true
  }
})

const futureMeetingsForQuery = bucketName => `
SELECT
  id,
  notifyTo,
  eventDate,
  {"buildingId": event.buildingId, "inPerson": true} event
FROM ${bucketName}
WHERE _documentType = 'scheduled-event' AND type = 'MEETINGS'
  AND notifyTo = $1 AND eventDate > NOW_UTC() AND event.inPerson
`

export class MeetingsRepository extends CouchbaseRepository {
  struct () {
    return DbMeeting
  }

  save (meeting) {
    return super.save(DbMeeting.fromMeeting(meeting))
  }

  futureMeetingsFor (userId) {
    return this.couchbaseAdapter.queryAsync(
      futureMeetingsForQuery(this.bucketName),
      [ userId ]
    ).then(rows => rows.map(r => fromJSON(r, DbMeeting).couchbaseToDomain()))
  }
}
