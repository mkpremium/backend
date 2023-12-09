import { AddBuildingOfferCommand, OfferRequestsRepository } from './offer-requests.repository'
import { WithPostgresRepository } from '../../infrastructure/postgres/postgres-repository'
import { BuildingOfferRequest } from './building-offer-request.entity'
import { EntityTarget } from 'typeorm'

export class PostgresOfferRequestsRepository
  extends WithPostgresRepository<BuildingOfferRequest> implements OfferRequestsRepository {
  async add (cmd: AddBuildingOfferCommand): Promise<AddBuildingOfferCommand & { id: string }> {
    const savedEntity = await this.repository.save({
      flipper: { id: cmd.flipperId },
      caller: { id: cmd.callerId },
      ownerId: { id: cmd.ownerId },
      contact: { id: cmd.destinationContactId },
      worksheetId: { id: cmd.worksheetId },
      buildingId: { id: cmd.buildingId }
    })

    return {
      id: savedEntity.id,
      ...cmd,
    }
  }

  protected getEntityTarget (): EntityTarget<BuildingOfferRequest> {
    return BuildingOfferRequest
  }
}
