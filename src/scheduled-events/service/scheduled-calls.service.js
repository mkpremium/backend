import t from 'tcomb'
import { NegotiationStatus } from '../../building/building'
import { TypedContactInfo } from '../../types/common'
import { N1qlQuery } from 'couchbase'
import fromJSON from 'tcomb/lib/fromJSON'
import { logger } from '../../infrastructure/logger'

export class ScheduledCallsService {
  constructor (couchbaseAdapter) {
    this.couchbaseAdapter = couchbaseAdapter
  }

  scheduledCallsFor (userId) {
    return this.couchbaseAdapter.queryAsync(
      N1qlQuery.fromString(scheduledCallsForQuery(this.couchbaseAdapter.bucketName)),
      [ userId ]
    ).then(rows => {
      return rows.map(
        ({ event, eventDate, building, owner, eventId }) => {
          const shapedRow = {
            id: eventId,
            eventDate,
            event: {
              ...event,
              owner: { ...owner, building }
            }
          }
          try {
            return fromJSON(shapedRow, ScheduledCallsView)
          } catch (error) {
            logger.error('parsing scheduled calls', { error, worksheetId: event.worksheetId })
            return shapedRow
          }
        }
      )
    })
  }
}

const scheduledCallsForQuery = bucketName => `
select
se.id eventId,
{se.event.contactId,se.event.worksheetId} event,
se.eventDate,
{
    building.id,
    building.address,
    building.negotiationStatus,
    building.floorArea,
    building.location,
    building.recentProposal,
    building.\`use\`,
    building.metadata,
    building.cadastre
} building,
{owner.id, owner.featuredContact, owner.person} owner

FROM ${bucketName} se
JOIN ${bucketName} worksheet ON worksheet._documentType = 'worksheet' AND worksheet.id = se.event.worksheetId
JOIN ${bucketName} building ON building._documentType = 'building' AND building.id = worksheet.relatedBuildingIds[0]
JOIN ${bucketName} owner ON owner._documentType = 'owner' AND owner.id = se.event.ownerId

WHERE se._documentType = 'scheduled-event' AND se.type = 'CALLS'
AND se.notifyTo = $1
`

const ScheduledCallsView = t.struct({
  id: t.String,
  eventDate: t.String,
  event: t.struct({
    owner: t.struct({
      id: t.String,
      building: t.struct({
        id: t.String,
        address: t.struct({
          city: t.String,
          neighborhood: t.String,
          type: t.maybe(t.String),
          street: t.String,
          number: t.union([ t.String, t.Number ]),
          postalCode: t.maybe(t.struct({
            number: t.union([ t.String, t.Number ])
          }))
        }),
        negotiationStatus: NegotiationStatus,
        floorArea: t.Number,

        location: t.maybe(t.struct({
          lat: t.maybe(t.Number),
          lng: t.maybe(t.Number)
        })),
        recentProposal: t.maybe(t.struct({
          proposal: t.Number,
          createdAt: t.String
        })),
        use: t.maybe(t.String),
        metadata: t.maybe(t.list(t.struct({
          id: t.String,
          mimeType: t.String,
          previewUrl: t.String
        }))),
        cadastre: t.maybe(t.struct({
          reference: t.String
        }))
      }),
      featuredContact: t.maybe(t.struct({
        phoneId: t.maybe(t.String),
        emailId: t.maybe(t.String)
      })),
      person: t.struct({
        name: t.String,
        contacts: t.list(TypedContactInfo)
      })
    }),
    contactId: t.String,
    worksheetId: t.String
  })
})
