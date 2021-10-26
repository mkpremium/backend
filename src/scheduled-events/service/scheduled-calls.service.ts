import t from 'tcomb'
import { BuildingProps, NegotiationStatus } from '../../building/building'
import { TypedContactInfo } from '../../owner/contact'
import fromJSON from 'tcomb/lib/fromJSON'
import { logger } from '../../infrastructure/logger'
import { CouchbaseAdapter } from '../../db/couchbase.adapter'
import { ContactProps } from '../../owner/owner'

export class ScheduledCallsService {
  constructor (
    private couchbaseAdapter: CouchbaseAdapter,
  ) {
  }

  scheduledCallsFor (userId): Promise<ScheduledCallProps[]> {
    return this.couchbaseAdapter.queryAsync(
      scheduledCallsForQuery(this.couchbaseAdapter.bucketName),
      [ userId ]
    ).then(rows => {
      return rows.map(parseRow)
    })
  }
}

export const parseRow = ({ event, eventDate, building, owner, eventId, createdBy }) => {
  const shapedRow = {
    id: eventId,
    createdBy,
    buildingId: building.id,
    eventDate,
    event: {
      ...event,
      owner: { ...owner, building }
    }
  }
  try {
    return fromJSON(shapedRow, ScheduledCallsView)
  } catch (error) {
    logger.error('parsing scheduled calls', { errorMessage: error.message, worksheetId: event.worksheetId })
    return shapedRow
  }
}

const scheduledCallsForQuery = bucketName => `
SELECT
se.id eventId,
se.createdBy,
{se.event.contactId,se.event.worksheetId, "buildingId": building.id} event,
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
    building.cadastre,
    building.lead
} building,
{owner.id, owner.featuredContact, owner.person} owner

FROM ${bucketName} se
JOIN ${bucketName} worksheet ON worksheet._documentType = 'worksheet'
    AND meta(worksheet).id = se.event.worksheetId
JOIN ${bucketName} building ON building._documentType = 'building'
    AND meta(building).id = worksheet.relatedBuildingIds[0]
JOIN ${bucketName} owner ON owner._documentType = 'owner'
    AND meta(owner).id = se.event.ownerId

WHERE se._documentType = 'scheduled-event' AND se.type = 'CALLS'
AND se.notifyTo = $1
`

interface ScheduledCallProps {
  createdBy: string
  eventDate: Date
  event: {
    worksheetId: string
    contactId: string
    owner: {
      id: string
      building: BuildingProps
      person: {
        name: string,
        contacts: ContactProps[]
      }
    }
  }
}

const ScheduledCallsView = t.struct({
  id: t.String,
  createdBy: t.String,
  buildingId: t.maybe(t.String), // Remove when all clients are using event's property.
  eventDate: t.String,
  event: t.struct({
    buildingId: t.String,
    owner: t.struct({
      id: t.String,
      building: t.struct({
        id: t.String,
        address: t.struct({
          city: t.String,
          neighborhood: t.maybe(t.String),
          type: t.maybe(t.String),
          street: t.String,
          number: t.union([ t.String, t.Number ]),
          postalCode: t.maybe(t.struct({
            number: t.maybe(t.union([ t.String, t.Number ]))
          }))
        }),
        negotiationStatus: t.maybe(NegotiationStatus),
        floorArea: t.union([ t.String, t.Number ]),

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
