import { BuildingsRepository } from './buildings.repository'
import { BuildingNegotiationStatus, BuildingProps } from '../building'
import { BuildingReadModel, BuildingsReadRepository } from './buildings-read.repository'
import * as TE from 'fp-ts/TaskEither'
import { TaskEither } from 'fp-ts/TaskEither'
import { EntityTarget, Equal } from 'typeorm'
import { Building } from '../building.entity'
import { pipe } from 'fp-ts/function'
import { fromPromise } from '../../infrastructure/fp-utils'
import { PostgresRepository } from '../../infrastructure/postgres/postgres-repository'
import { Owner } from '../../owner/owner.entity'
import { Flipper } from '../../flipper/flipper.entity'

export class PostgresBuildingsRepository
  extends PostgresRepository<BuildingProps, Building>
  implements BuildingsRepository, BuildingsReadRepository {
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

  protected getEntityTarget (): EntityTarget<Building> {
    return Building
  }

  protected entityToStruct (entity: Building): BuildingProps {
    return undefined
  }

  protected structToEntity (buildingStruct: BuildingProps): Partial<Building> {
    return {
      id: buildingStruct.id,
      address: buildingStruct.address,
      negotiationStatus: buildingStruct.negotiationStatus,
      // TODO: validate lead IDs (contact, owner, and worksheet)
      lead: buildingStruct.lead,
      featuredOwner: { id: buildingStruct.ownerId } as Owner,
      assignedFlipper: { id: buildingStruct.assignedAgentId } as Flipper,
      floorArea: typeof buildingStruct.floorArea === 'string' ? parseFloat(buildingStruct.floorArea) : buildingStruct.floorArea,
      publicIdentifier: buildingStruct.cadastre?.reference,
      location: buildingStruct.location,
      use: buildingStruct.use,
    }
  }
}


function mapEntityToReadModel (entity: Building): BuildingReadModel {
  return {} as BuildingReadModel
}
