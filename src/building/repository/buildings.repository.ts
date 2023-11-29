import { Repository } from '../../db/repository'

export interface BuildingsRepository extends Repository {
  assignBuildingToAgent (buildingId: string, agentId: string): Promise<void>

  pullBuildingsOutOfFreezer (buildingIds: string[]): Promise<void>
}

