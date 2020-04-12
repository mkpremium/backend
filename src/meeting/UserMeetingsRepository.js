import { N1qlQuery } from 'couchbase'

const GET_USER_MEETINGS_QUERY = `
SELECT id, event.eventAddress meetingAddress, eventDate meetingAt, event.buildingId, event.inPerson
FROM mkpremium
WHERE _documentType = 'scheduled-event' AND type = 'MEETINGS'
AND notifyTo = $1
`

export class UserMeetingsRepository {
  constructor (couchbaseAdapter) {
    this.couchbaseAdapter = couchbaseAdapter
  }

  getMeetingsFor (userId) {
    return this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(GET_USER_MEETINGS_QUERY), [userId]
    )
  }
}
