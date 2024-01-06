import t from 'tcomb'
import { validate } from 'tcomb-validation'
import { InvalidCommand } from '../../infrastructure/invalid-command.error'
import { BuildingsRepository } from '../repository/buildings.repository'
import { EventPublisher } from '../../infrastructure/event-bus'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'
import { DataSource } from 'typeorm'
import { CouchbaseOfferRequestsRepository } from '../repository/couchbase-offer-requests.repository'
import { BuildingOfferRequest } from '../repository/building-offer-request.entity'
import { Building } from '../building.entity'


interface AddOfferRequestCommand {
  ownerId: string,
  destinationContactId: string,
  reporterContactId: string,
  buildingId: string,
  callerId: string,
  flipperId: string,
  note: string
}

const AddOfferRequestCommand = t.struct<AddOfferRequestCommand>({
  ownerId: t.String,
  destinationContactId: t.String,
  reporterContactId: t.String,
  buildingId: t.String,
  callerId: t.String,
  flipperId: t.String,
  worksheetId: t.maybe(t.String),
  note: t.String
})

export interface OfferRequestCreated {
  name: DomainEventCatalog.OFFER_REQUEST__CREATED
  note: string
  userId: string
  buildingId: string
  request: any
}

export interface AddBuildingOfferCommand {
  flipperId: string,
  callerId: string,
  ownerId: string,
  destinationContactId: string,
  worksheetId?: string,
  buildingId: string
}

export class AddOfferRequestService {
  constructor (
    private couchbaseOfferRequestsRepository: CouchbaseOfferRequestsRepository,
    private buildingsRepository: BuildingsRepository,
    private eventBus: EventPublisher,
    private usePostgres: boolean,
    private ormDataSource: DataSource,
  ) {
  }

  async addOfferRequest (cmd: AddOfferRequestCommand) {
    this.assertValidCommand(cmd)

    const offerRequest = await (this.usePostgres ? this.doPostgres(cmd) : this.doCouchbase(cmd))

    await this.eventBus.publish({
      name: DomainEventCatalog.OFFER_REQUEST__CREATED,
      note: cmd.note,
      userId: cmd.callerId,
      buildingId: cmd.buildingId,
      request: offerRequest
    } as OfferRequestCreated)
  }

  private assertValidCommand (command: AddOfferRequestCommand) {
    const validation = validate(command, AddOfferRequestCommand)
    if (!validation.isValid()) {
      throw new InvalidCommand(validation.errors)
    }
  }

  private async doPostgres (cmd: AddOfferRequestCommand): Promise<AddBuildingOfferCommand & { id: string }> {
    return this.ormDataSource.transaction(async entityManager => {
      const savedOffer = await entityManager.save(BuildingOfferRequest, {
        flipper: { id: cmd.flipperId },
        caller: { id: cmd.callerId },
        owner: { id: cmd.ownerId },
        contact: { id: cmd.destinationContactId },
        building: { id: cmd.buildingId }
      })
      await entityManager.update(Building, { id: cmd.buildingId }, { assignedFlipper: { id: cmd.flipperId } })

      return {
        id: savedOffer.id,
        ...cmd,
      }
    })
  }

  private async doCouchbase (cmd: AddOfferRequestCommand): Promise<AddBuildingOfferCommand & { id: string }> {
    const offerRequest = await this.couchbaseOfferRequestsRepository.add(cmd)
    await this.buildingsRepository.assignBuildingToAgent(cmd.buildingId, cmd.flipperId)

    return offerRequest
  }
}
