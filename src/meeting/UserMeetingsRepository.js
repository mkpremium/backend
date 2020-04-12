import { N1qlQuery } from 'couchbase'

const GET_USER_MEETINGS_QUERY = `
SELECT meeting.id,
meeting.event.eventAddress meetingAddress,
meeting.eventDate meetingAt,
meeting.event.buildingId,
meeting.event.inPerson,
building.recentProposal.proposal proposalValue
FROM mkpremium meeting
LEFT JOIN mkpremium building ON building.id = meeting.event.buildingId AND building._documentType = 'building'
WHERE meeting._documentType = 'scheduled-event' AND meeting.type = 'MEETINGS'
AND meeting.notifyTo = $1
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
