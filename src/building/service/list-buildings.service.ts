import { DataSource, In } from 'typeorm'
import { Building } from '../building.entity'
import { BuildingReadModel } from '../repository/buildings-read.repository'
import { CouchbaseBuildingsReadRepository } from '../repository/couchbase-buildings-read.repository'
import { BuildingOfferRequest } from '../repository/building-offer-request.entity'
import { buildingEntityToReadModel } from '../repository/postgres-buildings.repository'

export class ListBuildingsService {
  constructor (
    private usePostgres: boolean,
    private ormDataSource: DataSource,
    private couchbaseBuildingsReadRepository: CouchbaseBuildingsReadRepository
  ) {
  }

  buildingsOfId (ids: string | string[]): Promise<BuildingReadModel[]> {
    return this.usePostgres ? this.buildingOfIdInPostgres(ids) : this.couchbaseBuildingsReadRepository.listById(typeof ids === 'string' ? [ ids ] : ids)
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
    // this.ormDataSource.
    const queryBuilder = this.ormDataSource.manager.createQueryBuilder(BuildingOfferRequest, 'offer')
      .select('offer.buildingId', 'buildingId')
      .addSelect('MAX(offer.createdAt)', 'last_offer_created_at')
      .where('offer.buildingId IN (:...ids)', { ids })
      .groupBy('offer.buildingId')
    const lastOfferRequests = await queryBuilder.getRawMany<{
      buildingId: string,
      last_offer_created_at: Date
    }>()

    return buildings.map((building) => {
      const lastOfferRequest = lastOfferRequests.find(({buildingId}) => buildingId === building.id)
      return buildingEntityToReadModel(building, lastOfferRequest?.last_offer_created_at)
    })
  }
}
