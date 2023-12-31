import { BuildingReadModel } from '../repository/buildings-read.repository'
import { CouchbaseBuildingsReadRepository } from '../repository/couchbase-buildings-read.repository'

export class ListBuildingsService {
  constructor (private couchbaseBuildingsReadRepository: CouchbaseBuildingsReadRepository) {
  }

  buildingsOfId (ids: string | string[]): Promise<BuildingReadModel[]> {
    return this.couchbaseBuildingsReadRepository.listById(typeof ids === 'string' ? [ ids ] : ids)
  }

  buildingsAssignedTo (flipperId: string): Promise<BuildingReadModel[]> {
    return this.couchbaseBuildingsReadRepository.listAssignedToPropertyAgentOfId(flipperId)
  }
}
