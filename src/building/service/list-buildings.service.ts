import { EntityManager, In } from 'typeorm'
import { Building } from '../building.entity'
import { BuildingReadModel } from '../repository/buildings-read.repository'
import type { CouchbaseBuildingsReadRepository } from '../repository/couchbase-buildings-read.repository'
import { BuildingOfferRequest } from '../repository/building-offer-request.entity'
import { buildingEntityToReadModel, mapBuildingEntityToStruct } from '../repository/postgres-buildings.repository'
import { PostgresOwnersRepository } from '../../owner/repository/postgres-owners.repository'
import { BuildingProps } from '../building'
import {
  LastBuildingMeeting,
  PostgresScheduledEventsRepository
} from '../../scheduled-events/repository/postgres-schedule-events.repository'
import { ScheduledEvent } from '../../scheduled-events/scheduled-event.entity'

export class ListBuildingsService {
  constructor (
    private usePostgres: boolean,
    private entityManager: EntityManager,
    private postgresOwnersRepository: PostgresOwnersRepository,
    private postgresScheduledEventsRepository: PostgresScheduledEventsRepository,
    private couchbaseBuildingsReadRepository: CouchbaseBuildingsReadRepository
  ) {
  }

  buildingsOfId (ids: string | string[]): Promise<BuildingReadModel[]> {
    return this.usePostgres
      ? this.buildingOfIdInPostgres(ids)
      : this.couchbaseBuildingsReadRepository.listById(typeof ids === 'string' ? [ids] : ids)
  }

  buildingsAssignedTo (flipperUserId: string): Promise<BuildingReadModel[]> {
    return this.usePostgres
      ? this.buildingAssignedToInPostgres(flipperUserId)
      : this.couchbaseBuildingsReadRepository.listAssignedToPropertyAgentOfId(flipperUserId)
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
      this.postgresScheduledEventsRepository.lastMeetingForBuildings(buildingIds)
    ])

    return buildings.reduce((acc, b) => {
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
    const allBuildingOwners = await this.postgresOwnersRepository.buildingOwners(ids)

    return buildings.map((building) => {
      const lastOfferRequest = lastOfferRequests.find(({ buildingId }) => buildingId === building.id)
      const buildingOwners = allBuildingOwners.filter(
        ({ buildingId }) => buildingId === building.id)
      return buildingEntityToReadModel(building, {
        lastOfferCreatedAt: lastOfferRequest?.offer_createdAt,
        owners: buildingOwners
      })
    })
  }

  private async buildingAssignedToInPostgres (flipperUserId: string) {
    const buildings = await this.entityManager.find(Building, {
      where: {
        assignedFlipper: { user: { id: flipperUserId } }
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
