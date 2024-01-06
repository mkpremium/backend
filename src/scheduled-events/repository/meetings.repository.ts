import moment from 'moment'
import t from 'tcomb'
import { CouchbaseRepository } from '../../db/couchbase.repository'
import { Meeting } from '../domain/meeting'

interface DbMeeting {
  id: string,
  notifyTo: string,
  eventDate: Date,
  event: {
    buildingId: string,
    inPerson: boolean
  },
  type: 'MEETINGS'
}

const DbMeeting = t.struct<DbMeeting>({
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

function couchbaseToDomain (record: DbMeeting) {
  return Meeting({
    id: record.id,
    buildingId: record.event.buildingId,
    withAgentOfId: record.notifyTo,
    meetingAt: moment(record.eventDate)
  })
}

function fromMeeting (meeting: Meeting): DbMeeting {
  return DbMeeting({
    id: meeting.id,
    type: 'MEETINGS',
    notifyTo: meeting.withAgentOfId,
    eventDate: meeting.meetingAt.toDate(),
    event: {
      buildingId: meeting.buildingId,
      inPerson: true
    }
  })
}

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

export class MeetingsRepository extends CouchbaseRepository<DbMeeting> {
  struct () {
    return DbMeeting
  }

  save (meeting) {
    return super.save(fromMeeting(meeting))
  }

  futureMeetingsFor (userId) {
    return this.couchbaseAdapter.queryAsync(
      futureMeetingsForQuery(this.bucketName),
      [ userId ]
    ).then(rows => rows.map(couchbaseToDomain))
  }
}
