import { BuildingsRepository } from './buildings.repository'
import { BuildingNegotiationStatus, BuildingProps } from '../building'
import { BuildingReadModel, BuildingsReadRepository } from './buildings-read.repository'
import { TaskEither } from 'fp-ts/TaskEither'
import { DataSource, Equal, Repository } from 'typeorm'
import { Building } from '../building.entity'
import { Building as BuildingStruct } from '../building'
import { pipe } from 'fp-ts/function'
import { fromPromise } from '../../infrastructure/fp-utils'
import * as TE from 'fp-ts/TaskEither'

export class PostgresBuildingsRepository implements BuildingsRepository, BuildingsReadRepository {
  private repository: Repository<Building>

  constructor (ormDataSource: DataSource) {
    this.repository = ormDataSource.getRepository(Building)
  }

  // Repository
  async save (buildingStruct: BuildingProps): Promise<any> {
    const savedEntity = await this.repository.save({
      id: buildingStruct.id,
      address: buildingStruct.address,
      negotiationStatus: buildingStruct.negotiationStatus,
      // TODO: validate lead IDs (contact, owner, and worksheet)
      lead: buildingStruct.lead,
      featuredOwner: { id: buildingStruct.ownerId },
      assignedFlipper: { id: buildingStruct.assignedAgentId },
      floorArea: typeof buildingStruct.floorArea === 'string' ? parseFloat(buildingStruct.floorArea) : buildingStruct.floorArea,
      publicIdentifier: buildingStruct.cadastre?.reference,
      location: buildingStruct.location,
      use: buildingStruct.use,
    })
    if (!buildingStruct.id) {
      buildingStruct = BuildingStruct.update(buildingStruct, { $set: { id: savedEntity.id } })
    }

    return buildingStruct
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
    return pipe(
      fromPromise(this.repository.findBy({
          assignedFlipper: Equal(flipperId),
          negotiationStatus: status
        })),
      TE.chain(buildings => TE.of(buildings.map(mapEntityToReadModel)))
    )
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


function mapEntityToReadModel (entity: Building): BuildingReadModel {
  return {} as BuildingReadModel
}
