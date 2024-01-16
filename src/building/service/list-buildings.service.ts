import { DataSource, In } from 'typeorm'
import { Building } from '../building.entity'
import { BuildingReadModel } from '../repository/buildings-read.repository'
import { CouchbaseBuildingsReadRepository } from '../repository/couchbase-buildings-read.repository'
import { BuildingOfferRequest } from '../repository/building-offer-request.entity'
import { buildingEntityToReadModel } from '../repository/postgres-buildings.repository'
import { PostgresOwnersRepository } from '../../owner/repository/postgres-owners.repository'

export class ListBuildingsService {
  constructor (
    private usePostgres: boolean,
    private ormDataSource: DataSource,
    private postgresOwnersRepository: PostgresOwnersRepository,
    private couchbaseBuildingsReadRepository: CouchbaseBuildingsReadRepository,
  ) {
  }

  buildingsOfId (ids: string | string[]): Promise<BuildingReadModel[]> {
    return this.usePostgres ?
      this.buildingOfIdInPostgres(ids) :
      this.couchbaseBuildingsReadRepository.listById(typeof ids === 'string' ? [ ids ] : ids)
  }

  buildingsAssignedTo (flipperId: string): Promise<BuildingReadModel[]> {
    return this.couchbaseBuildingsReadRepository.listAssignedToPropertyAgentOfId(flipperId)
  }

  private async buildingOfIdInPostgres (ids: string | string[]): Promise<BuildingReadModel[]> {
    if (typeof ids === 'string') {
      ids = [ ids ]
    }

    const buildings = await this.ormDataSource.manager.find(Building, {
      where: { id: In(ids) },
      relations: { images: true, }
    })

    const lastOfferRequests = await this.getLastOfferRequestForBuildings(ids);
    const allBuildingOwners = await this.postgresOwnersRepository.buildingOwners(ids)

    return buildings.map((building) => {
      const lastOfferRequest = lastOfferRequests.find(({buildingId}) => buildingId === building.id)
      const buildingOwners = allBuildingOwners.filter(
        ({buildingId}) => buildingId === building.id)
      return buildingEntityToReadModel(building, {
        lastOfferCreatedAt: lastOfferRequest?.lastOfferCreatedAt,
        owners: buildingOwners,
      })
    })
  }

  private async getLastOfferRequestForBuildings(ids: string[]) {
    const queryBuilder = this.ormDataSource.manager.createQueryBuilder(BuildingOfferRequest, 'offer')
      .select('offer.buildingId', 'buildingId')
      .addSelect('MAX(offer.createdAt)', 'lastOfferCreatedAt')
      .where('offer.buildingId IN (:...ids)', {ids})
      .groupBy('offer.buildingId')

    return await queryBuilder.getRawMany<{
      buildingId: string,
      lastOfferCreatedAt: Date
    }>();
  }

  private async buildingAssignedToInPostgres(flipperId: string) {
    const buildings = await this.ormDataSource.manager.find(Building, {
      where: {
        // TODO: use this method & check if we can exclude NO VENDE buildings to improve performance
        assignedFlipper: {id: flipperId}
      },
    })

    return this.buildingOfIdInPostgres(buildings.map(({id}) => id))
  }
}
