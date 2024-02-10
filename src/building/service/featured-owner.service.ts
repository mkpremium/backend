import { EntityManager } from 'typeorm'
import { Building } from '../building.entity'

export class FeaturedOwnerService {
  constructor (
    private entityManager: EntityManager
  ) {
  }

  async setBuildingFeaturedOwner (buildingId: string, ownerId: string) {
    await this.entityManager.update(Building, { id: buildingId }, { featuredOwner: { id: ownerId } })
  }
}
