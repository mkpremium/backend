import { CouchbaseRepository } from '../../db/couchbase.repository'
import { Owner, OwnerProps } from '../owner'
import fromJSON from 'tcomb/lib/fromJSON'
import { logger } from '../../infrastructure/logger'
import t from 'tcomb'
import { BuildingOwner, BuildingOwnerProps, FoundOwner, FoundOwnerProps, OwnerRepository } from './owner.repository'


const findOwnerByContactValueQuery = bucketName => `
SELECT
meta(owner).id,
owner.person.name,
owner.buildingId,
owner.person.contacts,
{
    meta(building).id,
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
meta(worksheet).id worksheetId,
{
    lastEvent.eventDate,
    "inPerson": lastEvent.event.inPerson,
    "ownerId": lastEvent.event.ownerId,
    "flipperName": lastEventFlipper.profile.firstName || ' ' || lastEventFlipper.profile.lastName
} AS lastEvent,
ARRAY {"at": sc.eventDate} FOR sc IN  scheduledCalls END as scheduledCalls

FROM ${bucketName} owner
JOIN ${bucketName} building ON building._documentType = 'building'
  AND meta(building).id = owner.buildingId
  AND (building.negotiationStatus IS MISSING OR building.negotiationStatus != 'DESCARTADO')
JOIN ${bucketName} worksheet ON worksheet._documentType = 'worksheet' AND worksheet.relatedBuildingIds[0] = meta(building).id

LEFT JOIN ${bucketName} lastEvent ON lastEvent._documentType = 'scheduled-event'
    AND meta(lastEvent).id = worksheet.lastAddedMeeting.id
LEFT JOIN ${bucketName} lastEventFlipper ON
    (lastEvent IS NOT NULL AND lastEvent IS NOT MISSING)
    AND lastEventFlipper._documentType = 'operator'
    AND meta(lastEventFlipper).id = lastEvent.notifyTo
LEFT NEST ${bucketName} scheduledCalls ON scheduledCalls._documentType = 'scheduled-event'
    AND scheduledCalls.type = 'CALLS'
    AND scheduledCalls.event.buildingId = meta(building).id

WHERE owner._documentType = 'owner'
AND ANY c IN owner.person.contacts SATISFIES c.\`value\` = $1 AND c.status != 'BAD' END
`

const buildingOwnersQuery = bucketName => `
SELECT
id,
person.name,
person.contacts,
featuredContact,
status,
type
FROM ${bucketName} owner
WHERE _documentType = 'owner' and buildingId = $1
`

export class CouchbaseOwnersRepository extends CouchbaseRepository<OwnerProps> implements OwnerRepository {
  async findByPhoneNumber (phoneNumber: string) {
    return this.couchbaseAdapter.queryAsync(
      findOwnerByContactValueQuery(this.bucketName),
      [ phoneNumber ]
    ).then(parseFoundPhones(phoneNumber))
  }

  async buildingOwners (buildingId): Promise<BuildingOwnerProps[]> {
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

  async verifiedOwnersOfBuildingWithId (buildingId: string): Promise<BuildingOwnerProps[]> {
    const owners = await this.buildingOwners(buildingId)
    return owners.filter(this.isVerifiedOwner)
  }

  isVerifiedOwner (owner: BuildingOwnerProps) {
    const contacts = owner.contacts
    const goodContacts = contacts.filter(c => c.status === 'GOOD')
    return goodContacts.length > 0
  }

  struct () {
    return Owner as any
  }
}

export function parseFoundPhones (phoneNumber): (result: any[]) => FoundOwnerProps[] {
  return function (result) {
    return fromJSON(result.map(rec => {
      const matchingContactIdx = rec.contacts.findIndex(c => c.value === phoneNumber)
      const building = rec.building
      building.negotiationStatus = rec.negotiationStatus || 'PENDIENTE'
      building.floorArea = !isNaN(parseInt(building.floorArea)) ? parseInt(building.floorArea) : undefined
      if (building.recentProposal) {
        building.latestProposal = {
          amount: building.recentProposal.proposal,
          createdAt: building.recentProposal.createdAt
        }
      }
      if (building.address.postalCode && !building.address.postalCode.number) {
        delete building.address.postalCode
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
    }), t.list(FoundOwner))
  }
}
