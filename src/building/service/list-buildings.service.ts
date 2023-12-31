import { DataSource, In } from 'typeorm'
import { Building } from '../building.entity'
import { BuildingReadModel } from '../repository/buildings-read.repository'
import { CouchbaseBuildingsReadRepository } from '../repository/couchbase-buildings-read.repository'
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
    const matches = await this.ormDataSource.manager.find(Building, {
      where: {
        id: In(typeof ids === 'string' ? [ids] : ids)
      },
      relations: {
        images: true,
      }
    })

    return matches.map(buildingEntityToReadModel)
  }
}
