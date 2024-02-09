import { CouchbaseRepository } from '../../db/couchbase.repository'
import { Owner, OwnerProps } from '../owner'
import fromJSON from 'tcomb/lib/fromJSON'
import { logger } from '../../infrastructure/logger'
import t from 'tcomb'
import {
  BuildingOwner,
  BuildingOwnerProps,
  FoundOwner,
  FoundOwnerProps,
  isVerifiedOwner,
  OwnerRepository
} from './owner.repository'

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
  async buildingOwners (buildingId): Promise<BuildingOwnerProps[]> {
    return this.couchbaseAdapter.queryAsync(
      buildingOwnersQuery(this.bucketName),
      [buildingId]
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
    return owners.filter(isVerifiedOwner)
  }

  struct () {
    return Owner
  }
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
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
        lastEvent: rec.lastEvent.eventDate !== undefined
          ? {
            eventDate: rec.lastEvent.eventDate,
            type: rec.lastEvent.inPerson ? 'meeting' : 'offer-request',
            ownerId: rec.lastEvent.ownerId,
            flipperName: rec.lastEvent.flipperName
          }
          : undefined,
        matchingContactId: rec.contacts[matchingContactIdx].id
      }
    }), t.list(FoundOwner))
  }
}
