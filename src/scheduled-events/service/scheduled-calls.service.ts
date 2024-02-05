import t from 'tcomb'
import { BuildingProps, NegotiationStatus } from '../../building/building'
import { TypedContactInfo } from '../../owner/contact'
import fromJSON from 'tcomb/lib/fromJSON'
import { logger } from '../../infrastructure/logger'
import { CouchbaseAdapter } from '../../db/couchbase.adapter'
import { ContactProps } from '../../owner/owner'
import { EntityManager } from 'typeorm'
import { mapBuildingEntityToStruct } from '../../building/repository/postgres-buildings.repository'
import { ScheduledEvent } from '../scheduled-event.entity'

export class ScheduledCallsService {
  constructor (
    private couchbaseAdapter: CouchbaseAdapter,
    private usePostgres: boolean,
    private entityManager: EntityManager
  ) {
  }

  async scheduledCallsFor (userId: string): Promise<ScheduledCallsView[]> {
    return this.usePostgres
      ? PostgresScheduledCallsService.scheduledCallsFor(this.entityManager, userId)
      : CouchbaseScheduledCallsService.scheduledCallsFor(this.couchbaseAdapter, userId)
  }

  async getById (callId: string): Promise<ScheduledCallsView> {
    return this.usePostgres
      ? PostgresScheduledCallsService.getById(
        this.entityManager, callId)
      : CouchbaseScheduledCallsService.getById(this.couchbaseAdapter, callId)
  }
}

class PostgresScheduledCallsService {
  static async scheduledCallsFor (entityManager: EntityManager, userId: string): Promise<ScheduledCallsView[]> {
    const scheduledEvents = await entityManager.find(ScheduledEvent, {
      where: {
        type: 'CALL' as const,
        notifyTo: {
          id: userId
        }
      },
      relations: this.relations
    })

    return scheduledEvents.map(mapScheduledEventToScheduledCall)
  }

  static async getById (entityManager: EntityManager, callId: string): Promise<ScheduledCallsView> {
    const scheduledEvent = await entityManager.findOneOrFail(ScheduledEvent, {
      where: { id: callId, type: 'CALL' as const },
      relations: this.relations
    })
    return mapScheduledEventToScheduledCall(scheduledEvent)
  }

  private static relations = {
    building: {
      worksheet: true,
      documents: true
    },
    contact: true,
    createdBy: true,
    owner: {
      person: {
        contacts: {
          contact: true
        }
      }
    }
  }
}

function mapScheduledEventToScheduledCall (scheduledEvent: ScheduledEvent): ScheduledCallsView {
  return {
    id: scheduledEvent.id,
    createdBy: scheduledEvent.createdBy.id,
    eventDate: scheduledEvent.scheduledFor,
    event: {
      worksheetId: scheduledEvent.building.worksheet.id,
      buildingId: scheduledEvent.building.id,
      contactId: scheduledEvent.contact.id,
      owner: {
        id: scheduledEvent.owner.id,
        building: mapBuildingEntityToStruct(scheduledEvent.building),
        person: {
          name: scheduledEvent.owner.person.fullName,
          contacts: scheduledEvent.owner.person.contacts.map(cp => ({ ...cp.contact, status: cp.status }))
        }
      }
    }
  }
}

class CouchbaseScheduledCallsService {
  static async scheduledCallsFor (couchbaseAdapter: CouchbaseAdapter, userId: string): Promise<ScheduledCallsView[]> {
    const rows = await couchbaseAdapter.queryAsync(
      scheduledCallQuery(couchbaseAdapter.bucketName, ['se.notifyTo = $1']),
      [userId]
    )
    return rows.map(parseCouchbaseScheduledEventRow)
  }

  static async getById (couchbaseAdapter: CouchbaseAdapter, callId: string): Promise<ScheduledCallsView> {
    const rows = await couchbaseAdapter.queryAsync(
      scheduledCallQuery(couchbaseAdapter.bucketName, ['se.id = $1']),
      [callId]
    )
    return parseCouchbaseScheduledEventRow(rows[0])
  }
}

export function parseCouchbaseScheduledEventRow ({
  event,
  eventDate,
  building,
  owner,
  eventId,
  createdBy
}): ScheduledCallsView {
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

interface ScheduledCallsView {
  id: string
  createdBy: string
  eventDate: Date
  event: {
    buildingId: string
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

/* eslint-disable no-unused-vars */
const ScheduledCallsView = t.struct<ScheduledCallsView>({
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
          number: t.union([t.String, t.Number]),
          postalCode: t.maybe(t.struct({
            number: t.maybe(t.union([t.String, t.Number]))
          }))
        }),
        negotiationStatus: t.maybe(NegotiationStatus),
        floorArea: t.union([t.String, t.Number]),

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
