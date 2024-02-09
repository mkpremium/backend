import { EntityManager, In, Not } from 'typeorm'
import { Building } from '../building.entity'
import { BuildingReadModel } from '../repository/buildings-read.repository'
import { BuildingOfferRequest } from '../repository/building-offer-request.entity'
import { buildingEntityToReadModel, mapBuildingEntityToStruct } from '../repository/postgres-buildings.repository'
import { PostgresOwnersRepository } from '../../owner/repository/postgres-owners.repository'
import { BuildingProps } from '../building'
import {
  LastBuildingMeeting,
  PostgresScheduledEventsRepository
} from '../../scheduled-events/repository/postgres-schedule-events.repository'
import { ScheduledEvent } from '../../scheduled-events/scheduled-event.entity'
import type { Logger } from 'winston'

export class ListBuildingsService {
  constructor (
    private entityManager: EntityManager,
    private ownersRepository: PostgresOwnersRepository,
    private scheduledEventsRepository: PostgresScheduledEventsRepository,
    private logger: Logger
  ) {
  }

  buildingsOfId (ids: string | string[]): Promise<BuildingReadModel[]> {
    return this.buildingOfIdInPostgres(ids)
  }

  buildingsAssignedTo (flipperUserId: string): Promise<BuildingReadModel[]> {
    return this.buildingAssignedToInPostgres(flipperUserId)
  }

  async getBuildingFullInformation (buildingIds: string[]): Promise<Record<string, {
    building: BuildingProps & { worksheetId: string },
    lastOfferRequest?: LastBuildingOffer,
    lastMeeting?: LastBuildingMeeting,
    scheduledCalls: ScheduledEvent[]
  }>> {
    const [buildings, scheduledCalls, lastBuildingsOfferRequests, lastMeetings] = await Promise.all([
      this.entityManager.find(Building, {
        where: {
          id: In(buildingIds)
        },
        // Same as in PostgresBuildingsRepository#relations plus worksheet
        relations: {
          assignedFlipper: true,
          featuredOwner: true,
          documents: true,
          proposals: true,
          worksheet: true
        }
      }),
      this.entityManager.find(ScheduledEvent, {
        where: { building: { id: In(buildingIds) } },
        loadRelationIds: true
      }),
      getLastOfferRequestForBuildings(buildingIds, this.entityManager),
      this.scheduledEventsRepository.lastMeetingForBuildings(buildingIds)
    ])

    return buildings.reduce((acc, b) => {
      if (!b.worksheet) {
        this.logger.error('Building without worksheet', { buildingId: b.id })
        return acc
      }

      acc[b.id] = {
        building: { ...mapBuildingEntityToStruct(b), worksheetId: b.worksheet.id },
        lastOfferRequest: lastBuildingsOfferRequests.find((offer) => offer.buildingId === b.id),
        lastMeeting: lastMeetings.find((meeting) => meeting.buildingId === b.id),
        scheduledCalls: scheduledCalls.filter(se => (se.building as unknown as string) === b.id)
      }
      return acc
    }, {})
  }

  private async buildingOfIdInPostgres (ids: string | string[]): Promise<BuildingReadModel[]> {
    if (typeof ids === 'string') {
      ids = [ids]
    }

    const buildings = await this.entityManager.find(Building, {
      where: { id: In(ids) },
      // Same as in BuildingRepository but without the assignedFlipper as it's not needed here
      relations: {
        featuredOwner: true,
        documents: true,
        proposals: true
      }
    })

    const lastOfferRequests = await getLastOfferRequestForBuildings(ids, this.entityManager)
    const allBuildingOwners = await this.ownersRepository.buildingOwners(ids)

    return buildings.map((building) => {
      const lastOfferRequest = lastOfferRequests.find(({ buildingId }) => buildingId === building.id)
      const buildingOwners = allBuildingOwners.filter(
        ({ buildingId }) => buildingId === building.id)
      const mappedBuilding: BuildingReadModel = buildingEntityToReadModel(building, {
        lastOfferCreatedAt: lastOfferRequest?.offer_createdAt,
        owners: buildingOwners
      })
      if (!mappedBuilding.owner) {
        this.logger.error('Building without owner', { buildingId: building.id })
        return undefined
      }

      return mappedBuilding
    }).filter(Boolean)
  }

  private async buildingAssignedToInPostgres (flipperUserId: string) {
    const buildings = await this.entityManager.find(Building, {
      where: {
        assignedFlipper: { user: { id: flipperUserId } },
        negotiationStatus: Not(In(['DESCARTADO' as const, 'NO VENDE' as const]))
      }
    })

    return this.buildingOfIdInPostgres(buildings.map(({ id }) => id))
  }
}

export interface LastBuildingOffer {
  buildingId: string,
  offer_createdAt: Date,
  ownerId: string,
}

export async function getLastOfferRequestForBuildings (
  ids: string[],
  entityManager: EntityManager
): Promise<LastBuildingOffer[]> {
  if (ids.length === 0) {
    return []
  }

  const queryBuilder = entityManager.createQueryBuilder(BuildingOfferRequest, 'offer')
    .distinctOn(['offer.buildingId'])
    .select(['offer.buildingId', 'offer.createdAt', 'offer.ownerId'])
    .where('offer.buildingId IN (:...ids)', { ids })
    .orderBy('offer.buildingId')
    .addOrderBy('offer.createdAt', 'DESC')

  return await queryBuilder.getRawMany<LastBuildingOffer>()
}
