import { Owner, OwnerProps } from '../owner'
import t from 'tcomb'
import { CouchbaseRepository } from '../../db/couchbase.repository'
import fromJSON from 'tcomb/lib/fromJSON'
import { logger } from '../../infrastructure/logger'
import { DateTimeString } from '../../infrastructure/shared-types'
import { NegotiationStatus } from '../../building/building'
import { WorksheetBuilding } from '../../worksheet/repository/worksheet.repository'

const findOwnerByContactValueQuery = bucketName => `
SELECT
owner.id,
owner.name,
owner.buildingId,
owner.person.contacts,
{
    building.id,
    building.address,
    building.metadata,
    building.\`use\`,
    building.location,
    building.recentProposal,
    building.cadastre,
    building.floorArea,
    building.negotiationStatus,
    "featuredOwnerId": building.ownerId
} as building,
building.negotiationStatus,
worksheet.id worksheetId,
{
    lastEvent.eventDate,
    "inPerson": lastEvent.event.inPerson,
    "ownerId": lastEvent.event.ownerId,
    "flipperName": lastEventFlipper.profile.firstName || ' ' || lastEventFlipper.profile.lastName
} AS lastEvent,
ARRAY {"at": sc.eventDate} FOR sc IN  scheduledCalls END as scheduledCalls

FROM ${bucketName} owner
JOIN ${bucketName} building ON building._documentType = 'building' AND building.id = owner.buildingId
  AND (building.negotiationStatus IS MISSING OR building.negotiationStatus != 'DESCARTADO')
JOIN ${bucketName} worksheet ON worksheet._documentType = 'worksheet' AND worksheet.relatedBuildingIds[0] = building.id

LEFT JOIN ${bucketName} lastEvent ON lastEvent._documentType = 'scheduled-event' AND lastEvent.id = worksheet.lastAddedMeeting.id
LEFT JOIN ${bucketName} lastEventFlipper ON  lastEventFlipper._documentType = 'operator' and lastEventFlipper.id = lastEvent.notifyTo
LEFT NEST ${bucketName} scheduledCalls ON scheduledCalls._documentType = 'scheduled-event'
    AND scheduledCalls.type = 'CALLS'
    AND scheduledCalls.event.ownerId = owner.id

WHERE owner._documentType = 'owner'
AND ANY c IN owner.person.contacts SATISFIES c.\`value\` = $1 AND c.status != 'BAD' END
`

const buildingOwnersQuery = bucketName => `
SELECT
id,
name,
person.contacts,
featuredContact
FROM ${bucketName} owner
WHERE _documentType = 'owner' and buildingId = $1
`

const FoundOwner = t.struct({
  id: t.String,
  buildingId: t.String,
  negotiationStatus: NegotiationStatus,
  worksheetId: t.String,
  scheduledCalls: t.list(t.struct({
    at: DateTimeString
  })),
  matchingContactId: t.String,
  name: t.String,
  contacts: t.list(t.struct({
    id: t.String,
    value: t.String,
    type: t.enums.of([ 'TELEFONO', 'MOVIL', 'EMAIL' ]),
    status: t.enums.of([ 'UNDEFINED', 'GOOD', 'BAD' ])
  })),
  lastEvent: t.maybe(t.struct({
    eventDate: DateTimeString,
    type: t.enums.of([ 'meeting', 'offer-request' ]),
    ownerId: t.String,
    flipperName: t.String
  })),
  building: WorksheetBuilding
})

const BuildingOwner = t.struct({
  id: t.String,
  name: t.String,
  contacts: t.list(t.struct({
    id: t.String,
    status: t.enums.of([ 'GOOD', 'BAD', 'UNDEFINED' ]),
    type: t.enums.of([ 'TELEFONO', 'MOVIL', 'EMAIL' ]),
    value: t.String
  })),
  featuredContact: t.maybe(t.struct({
    phoneId: t.maybe(t.String),
    emailId: t.maybe(t.String)
  }))
})

export class OwnerRepository extends CouchbaseRepository<OwnerProps> {
  async findByPhoneNumber (phoneNumber) {
    return this.couchbaseAdapter.queryAsync(
      findOwnerByContactValueQuery(this.bucketName),
      [ phoneNumber ]
    ).then(result => fromJSON(result.map(rec => {
      const matchingContactIdx = rec.contacts.findIndex(c => c.value === phoneNumber)
      const building = rec.building
      if (building.recentProposal) {
        building.latestProposal = {
          amount: building.recentProposal.proposal,
          createdAt: building.recentProposal.createdAt
        }
      }

      return {
        ...rec,
        building,
        negotiationStatus: rec.negotiationStatus || 'PENDIENTE',
        lastEvent: rec.lastEvent.eventDate !== undefined ? {
          eventDate: rec.lastEvent.eventDate,
          type: rec.lastEvent.inPerson ? 'meeting' : 'offer-request',
          ownerId: rec.lastEvent.ownerId,
          flipperName: rec.lastEvent.flipperName
        } : undefined,
        matchingContactId: rec.contacts[ matchingContactIdx ].id
      }
    }), t.list(FoundOwner)))
  }

  async buildingOwners (buildingId): Promise<OwnerProps[]> {
    return this.couchbaseAdapter.queryAsync(
      buildingOwnersQuery(this.bucketName),
      [ buildingId ]
    ).then(rawOwners => rawOwners.map(o => {
      try {
        return fromJSON(o, BuildingOwner)
      } catch (error) {
        logger.error('parsing building owner', {
          buildingId,
          ownerId: o.id,
          errorMessage: error.message,
          stack: error.stack
        })
        return o
      }
    }))
  }

  struct () {
    return Owner as any
  }
}
