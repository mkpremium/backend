import { BuildingsRepository } from './buildings.repository'
import { BuildingNegotiationStatus, BuildingProps } from '../building'
import Promise from 'bluebird'
import { BuildingReadModel, BuildingsReadRepository } from './buildings-read.repository'
import { TaskEither } from 'fp-ts/TaskEither'

export class PostgresBuildingsRepository implements BuildingsRepository, BuildingsReadRepository {
  constructor () {
  }

  // Repository
  save (data: BuildingProps): Promise<any> {
    return Promise.reject(new Error('Not implemented'))
  }

  get (id: string): Promise<BuildingProps> {
    return Promise.reject(new Error('Not implemented'))
  }

  // BuildingsRepository
  assignBuildingToAgent (buildingId: string, agentId: string): Promise<void> {
    return Promise.reject(new Error('Not implemented'))
  }

  pullBuildingsOutOfFreezer (buildingIds: string[]): Promise<void> {
    return Promise.reject(new Error('Not implemented'))
  }

  //   BuildingsReadRepository
  assignedToFlipperAndWithStatus (flipperId: string, status: BuildingNegotiationStatus): TaskEither<Error, BuildingReadModel[]> {
    throw new Error('Not implemented')
  }

  listAssignedToPropertyAgentOfId (agentId): Promise<BuildingReadModel[]> {
    return Promise.reject(new Error('Not implemented'))
  }

  listById (ids): Promise<BuildingReadModel[]> {
    return Promise.reject(new Error('Not implemented'))
  }

  listProposalsForBuilding (buildingId): Promise<unknown[]> {
    return Promise.reject(new Error('Not implemented'))
  }

  ofCadastreReference (cadastreReference: string): TaskEither<Error, BuildingReadModel | undefined> {
    throw new Error('Not implemented')
  }
}
