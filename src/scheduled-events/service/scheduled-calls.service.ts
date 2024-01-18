import t from 'tcomb'
import { BuildingProps, NegotiationStatus } from '../../building/building'
import { TypedContactInfo } from '../../owner/contact'
import fromJSON from 'tcomb/lib/fromJSON'
import { logger } from '../../infrastructure/logger'
import { CouchbaseAdapter } from '../../db/couchbase.adapter'
import { ContactProps } from '../../owner/owner'
import { DataSource, In } from 'typeorm'
import { BuildingOfferRequest } from '../../building/repository/building-offer-request.entity'
import { mapBuildingEntityToStruct } from '../../building/repository/postgres-buildings.repository'
import { ownerEntityToStruct } from '../../owner/repository/postgres-owners.repository'
import { Building } from '../../building/building.entity'

export class ScheduledCallsService {
  constructor (
    private couchbaseAdapter: CouchbaseAdapter,
    private usePostgres: boolean,
    private ormDataSource: DataSource,
  ) {
  }

  async scheduledCallsFor (userId: string): Promise<ScheduledCallProps[]> {
    return this.usePostgres ? PostgresScheduledCallsService.scheduledCallsFor(
        this.ormDataSource, userId) :
      CouchbaseScheduledCallsService.scheduledCallsFor(this.couchbaseAdapter, userId)
  }

  async getById (callId: string): Promise<ScheduledCallProps> {
    const rows = await this.couchbaseAdapter.queryAsync(
      scheduledCallQuery(this.couchbaseAdapter.bucketName, [ 'se.id = $1' ]),
      [ callId ]
    )
    return parseCouchbaseScheduledEventRow(rows[ 0 ])
  }
}

class PostgresScheduledCallsService {
  static async scheduledCallsFor (ormDataSource: DataSource, userId: string): Promise<ScheduledCallProps[]> {
    // TODO: why are we using the offer request here?
    const offerRequests = await ormDataSource.manager.find(BuildingOfferRequest, {
      where: { flipper: { user: { id: userId } } },
      relations: {
        building: true,
        caller: true,
        contact: true,
        owner: {
          person: {
            featuredEmailContact: true,
            featuredPhoneContact: true,
            contacts: {
              contact: true
            }
          },
        }
      },
    })
    const buildingIds = offerRequests.map(or => or.building.id)
    const buildings = await ormDataSource.manager.find(Building, {
      where: {
        id: In(buildingIds)
      },
      relations: {
        assignedFlipper: true,
        featuredOwner: true,
        images: true,
        proposals: true,
      }
    })

    return offerRequests.map(offerRequest => ({
      createdBy: offerRequest.caller.id,
      eventDate: offerRequest.createdAt,
      event: {
        contactId: offerRequest.contact.id,
        worksheetId: undefined,
        owner: {
          ...ownerEntityToStruct({ ...offerRequest.owner, building: {id: offerRequest.building.id} as any }),
          building: mapBuildingEntityToStruct(buildings.find(b => b.id === offerRequest.building.id))
        },
      }
    }))
  }
}

class CouchbaseScheduledCallsService {
  static async scheduledCallsFor (couchbaseAdapter: CouchbaseAdapter, userId: string): Promise<ScheduledCallProps[]> {
    const rows = await couchbaseAdapter.queryAsync(
      scheduledCallQuery(couchbaseAdapter.bucketName, [ 'se.notifyTo = $1' ]),
      [ userId ]
    )
    return rows.map(parseCouchbaseScheduledEventRow)
  }

  static async getById (couchbaseAdapter: CouchbaseAdapter, callId: string): Promise<ScheduledCallProps> {
    const rows = await couchbaseAdapter.queryAsync(
      scheduledCallQuery(couchbaseAdapter.bucketName, [ 'se.id = $1' ]),
      [ callId ]
    )
    return parseCouchbaseScheduledEventRow(rows[ 0 ])
  }
}

export function parseCouchbaseScheduledEventRow ({
                                                   event,
                                                   eventDate,
                                                   building,
                                                   owner,
                                                   eventId,
                                                   createdBy
                                                 }): ScheduledCallProps {
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

const scheduledCallQuery = (bucketName: string, conditions: string[]) => `
    SELECT se.id eventId,
           se.createdBy, {se.event.contactId, se.event.worksheetId, "buildingId": building.id} event, se.eventDate, {
        building.id, building.address, building.negotiationStatus, building.floorArea, building.location, building.recentProposal, building.\`use\`, building.metadata, building.cadastre, building.lead
        } building, {owner.id, owner.featuredContact, owner.person} owner

    FROM ${bucketName} se
        JOIN ${bucketName} worksheet
    ON worksheet._documentType = 'worksheet'
        AND meta(worksheet).id = se.event.worksheetId
        JOIN ${bucketName} building ON building._documentType = 'building'
        AND meta(building).id = worksheet.relatedBuildingIds[0]
        JOIN ${bucketName} owner ON owner._documentType = 'owner'
        AND meta(owner).id = se.event.ownerId

    WHERE se._documentType = 'scheduled-event'
      AND se.type = 'CALLS' AND ${conditions.join(' AND ')}
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

const ScheduledCallsView = t.struct<ScheduledCallProps>({
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
