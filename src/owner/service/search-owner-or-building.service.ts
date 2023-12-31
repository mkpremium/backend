import { DataSource, In } from 'typeorm'
import type { CouchbaseOwnersRepository } from '../repository/couchbase-owners.repository'
import { FoundOwner, FoundOwnerProps } from '../repository/owner.repository'
import { Building } from '../../building/building.entity'
import { ownerEntityToStruct } from '../repository/postgres-owners.repository'
import fromJSON from 'tcomb/lib/fromJSON'
import t from 'tcomb'
import { Owner } from '../owner.entity'
import { BuildingProps } from '../../building/building'
import { mapBuildingEntityToStruct } from '../../building/repository/postgres-buildings.repository'

export class SearchOwnerOrBuildingService {
  constructor (
    private couchbaseOwnersRepository: CouchbaseOwnersRepository,
    private ormDataSource: DataSource,
    private usePostgres: boolean,
  ) {
  }

  search (phoneNumber: string): Promise<FoundOwnerProps[]> {
    return this.usePostgres ? this.searchByPhoneInPostgres(phoneNumber) : this.couchbaseOwnersRepository.findByPhoneNumber(phoneNumber)
  }

  private async searchByPhoneInPostgres (phoneNumber: string): Promise<FoundOwnerProps[]> {
    const result = await this.ormDataSource.manager.find(Owner, {
      where: {
        person: {
          contacts: {
            contact: {
              value: phoneNumber,
              type: In([ 'TELEFONO', 'MOVIL' ]),
            },
          },
        },
      },
      relations: {
        person: {
          contacts: {
            contact: true
          },
        },
        building: true
      }
    })
    const buildings = await this.ormDataSource.manager.find(Building, {
      where: {
        id: In(result.map(fo => fo.building.id))
      },
      // Same as in PostgresBuildingsRepository#relations plus worksheet
      relations: {
        assignedFlipper: true,
        featuredOwner: true,
        images: true,
        proposals: true,
        worksheet: true,
      }
    })
    const mappedBuildings = buildings.reduce((acc, b) => {
      acc[ b.id ] = { ...mapBuildingEntityToStruct(b), worksheetId: b.worksheet.id }
      return acc
    }, {} as Record<string, BuildingProps & { worksheetId: string }>)

    return fromJSON(result.map(foundOwner => {
      const matchingContactIdx = foundOwner.person.contacts.findIndex(cp => cp.contact.value === phoneNumber)
      const owner = ownerEntityToStruct(foundOwner)
      const { contacts } = owner.person
      delete owner.person
      const building = mappedBuildings[ owner.buildingId ]

      return {
        ...owner,
        contacts,
        building,
        worksheetId: building.worksheetId,
        negotiationStatus: building.negotiationStatus ?? 'PENDIENTE',
        matchingContactId: foundOwner.person.contacts[ matchingContactIdx ].id,
        scheduledCalls: [], // TODO: add scheduledCalls
        // TODO: add lastEvent
      }
    }), t.list(FoundOwner))
  }
}
