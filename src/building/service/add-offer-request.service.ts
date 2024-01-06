import t from 'tcomb'
import { validate } from 'tcomb-validation'
import { InvalidCommand } from '../../infrastructure/invalid-command.error'
import { AddBuildingOfferCommand, OfferRequestsRepository } from '../repository/offer-requests.repository'
import { BuildingsRepository } from '../repository/buildings.repository'
import { EventPublisher } from '../../infrastructure/event-bus'
import { DomainEventCatalog } from '../../infrastructure/postgres/domain-event.entity'


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

export class AddOfferRequestService {
  constructor (
    private offerRequestsRepository: OfferRequestsRepository,
    private buildingsRepository: BuildingsRepository,
    private eventBus: EventPublisher,
    private usePostgres: boolean
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

  private async doPostgres(cmd: AddOfferRequestCommand): Promise<AddBuildingOfferCommand & {id: string}> {
    return await this.offerRequestsRepository.add(cmd)
  }

  private async doCouchbase(cmd: AddOfferRequestCommand): Promise<AddBuildingOfferCommand & {id: string}> {
    const offerRequest = await this.offerRequestsRepository.add(cmd)
    await this.buildingsRepository.assignBuildingToAgent(cmd.buildingId, cmd.flipperId)

    return offerRequest
  }
}
