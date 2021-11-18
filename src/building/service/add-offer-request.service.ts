import t from 'tcomb'
import { validate } from 'tcomb-validation'
import { InvalidCommand } from '../../infrastructure/invalid-command.error'
import { OfferRequestsRepository } from '../repository/offer-requests.repository'
import { BuildingsRepository } from '../repository/buildings.repository'
import { EventPublisher } from '../../infrastructure/event-bus'

const AddOfferRequestCommand = t.struct({
  ownerId: t.String,
  destinationContactId: t.String,
  reporterContactId: t.String,
  buildingId: t.String,
  callerId: t.String,
  flipperId: t.String,
  worksheetId: t.String,
  note: t.String
})

export interface OfferRequestCreated {
  name: 'offer-request.created'
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
  ) {
  }

  async addOfferRequest (addRequestCommand) {
    this.assertValidCommand(addRequestCommand)

    const offerRequest = await this.offerRequestsRepository.add(addRequestCommand)
    await this.buildingsRepository.assignBuildingToAgent(addRequestCommand.buildingId, addRequestCommand.flipperId)

    await this.eventBus.publish({
      name: 'offer-request.created',
      note: addRequestCommand.note,
      userId: addRequestCommand.callerId,
      buildingId: addRequestCommand.buildingId,
      request: offerRequest
    } as OfferRequestCreated)
  }

  assertValidCommand (command) {
    const validation = validate(command, AddOfferRequestCommand)
    if (!validation.isValid()) {
      throw new InvalidCommand(validation.errors)
    }
  }
}
