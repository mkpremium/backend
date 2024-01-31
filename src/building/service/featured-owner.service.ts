import { CouchbaseBuildingsRepository } from '../repository/couchbase-building.repository'
import { EntityManager } from 'typeorm'
import { Building } from '../building.entity'

export class FeaturedOwnerService {
  constructor (
    private couchbaseBuildingsRepository: CouchbaseBuildingsRepository,
    private usePostgres: boolean,
    private entityManager: EntityManager
  ) {
  }

  async setBuildingFeaturedOwner (buildingId: string, ownerId: string) {
    if (this.usePostgres) {
      await this.entityManager.update(Building, { id: buildingId }, { featuredOwner: { id: ownerId } })
    } else {
      await this.couchbaseBuildingsRepository.setBuildingFeaturedOwner(buildingId, ownerId)
    }
  }
}
