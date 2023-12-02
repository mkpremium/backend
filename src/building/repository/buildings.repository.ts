import { Repository } from '../../db/repository'
import { BuildingProps } from '../building'

export interface BuildingsRepository extends Repository<BuildingProps> {
  assignBuildingToAgent (buildingId: string, agentId: string): Promise<void>

  pullBuildingsOutOfFreezer (buildingIds: string[]): Promise<void>
}

