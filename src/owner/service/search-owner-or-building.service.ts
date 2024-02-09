import { EntityManager, In } from 'typeorm'
import { FoundOwner, FoundOwnerProps } from '../repository/owner.repository'
import { ownerEntityToStruct } from '../repository/postgres-owners.repository'
import fromJSON from 'tcomb/lib/fromJSON'
import t from 'tcomb'
import { Owner } from '../owner.entity'
import { ListBuildingsService } from '../../building/service/list-buildings.service'
import { inferBuildingLastEvent } from '../../building/service/infer-building-last-event'

export class SearchOwnerOrBuildingService {
  constructor (
    private entityManager: EntityManager,
    private listBuildingsService: ListBuildingsService
  ) {
  }

  async search (phoneNumber: string): Promise<FoundOwnerProps[]> {
    const owners = await this.entityManager.find(Owner, {
      where: {
        person: {
          contacts: {
            contact: {
              value: phoneNumber,
              type: In(['TELEFONO', 'MOVIL'])
            }
          }
        }
      },
      relations: {
        person: {
          contacts: {
            contact: true
          }
        },
        building: true
      }
    })
    if (owners.length === 0) {
      return []
    }

    const mappedBuildings = await this.listBuildingsService.getBuildingFullInformation(
      owners.map(fo => fo.building.id))

    return fromJSON(owners.map(foundOwner => {
      if (!mappedBuildings[foundOwner.building.id]) {
        return undefined
      }
      const matchingContactIdx = foundOwner.person.contacts.findIndex(cp => cp.contact.value === phoneNumber)
      const owner = ownerEntityToStruct(foundOwner)
      const { contacts } = owner.person
      delete owner.person
      const { building, lastOfferRequest, lastMeeting, scheduledCalls } = mappedBuildings[owner.buildingId]

      return {
        ...owner,
        contacts,
        building,
        worksheetId: building.worksheetId,
        negotiationStatus: building.negotiationStatus ?? 'PENDIENTE',
        matchingContactId: foundOwner.person.contacts[matchingContactIdx].contact.id,
        scheduledCalls: scheduledCalls.filter(se => (se.building as unknown as string) === building.id)
          .map(se => ({ at: se.scheduledFor.toISOString() })),
        lastEvent: inferBuildingLastEvent(lastOfferRequest, lastMeeting)
      } as FoundOwnerProps
    }).filter(Boolean), t.list(FoundOwner))
  }
}
