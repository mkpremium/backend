import { N1qlQuery } from 'couchbase'

const GET_USER_MEETINGS_QUERY = `
SELECT meeting.id,
meeting.event.eventAddress meetingAddress,
meeting.eventDate meetingAt,
meeting.event.buildingId,
meeting.event.inPerson,
building.recentProposal.proposal proposalValue,
meeting.event.contactId,
building.metadata,

owner.name as contactName,
owner.person.contacts
FROM mkpremium meeting
LEFT JOIN mkpremium building ON building.id = meeting.event.buildingId AND building._documentType = 'building'

LEFT JOIN mkpremium owner ON owner.id = meeting.event.owner.id AND owner._documentType = 'owner'

WHERE meeting._documentType = 'scheduled-event' AND meeting.type = 'MEETINGS'
AND meeting.notifyTo = $1
`

export class UserMeetingsRepository {
  constructor (couchbaseAdapter) {
    this.couchbaseAdapter = couchbaseAdapter
  }

  getMeetingsFor (userId) {
    return this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(GET_USER_MEETINGS_QUERY), [ userId ]
    ).then(meetings =>
      meetings.map(
        ({ id, meetingAddress, meetingAt, buildingId, inPerson, proposalValue, contactId, contacts, contactName, metadata = [] }) => {
          const thumbnails = metadata.filter(m => m.mimeType === 'image/jpeg').map(({ id, mimeType, previewUrl }) => ({
            id,
            mimeType,
            thumbnailUrl: previewUrl
          }))
          const phoneContact = contacts ? contacts.find(c => ['TELEFONO', 'MOVIL'].indexOf(c.type) !== -1 && (!contactId || c.id === contactId)) : undefined
          const emailContact = contacts ? contacts.find(c => c.type === 'EMAIL' && (!contactId || c.id === contactId)) : undefined
          return {
            id,
            meetingAddress,
            meetingAt,
            buildingId,
            inPerson,
            proposalValue,
            contactName,
            phoneNumber: phoneContact ? phoneContact.value : undefined,
            email: emailContact ? emailContact.value : undefined,
            thumbnail: thumbnails.length > 0 ? thumbnails[ 0 ] : undefined
          }
        })
    )
  }
}
