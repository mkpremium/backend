import t from 'tcomb'
import { validate } from 'tcomb-validation'
import { InvalidCommand } from '../../infrastructure/invalid-command.error'
import { BuildingsRepository } from '../repository/buildings.repository'
import { EventBus } from '../../infrastructure/event-bus'
import { requestOfferByFlipper } from '../building'

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
    private buildingsRepository: BuildingsRepository,
    private eventBus: EventBus
  ) {
  }

  async addOfferRequest (addRequestCommand) {
    this.assertValidCommand(addRequestCommand)

    await this.buildingsRepository.save(
      requestOfferByFlipper(
        await this.buildingsRepository.get(addRequestCommand.buildingId),
        addRequestCommand.flipperId
      )
    )

    await this.eventBus.publish({
      name: 'offer-request.created',
      note: addRequestCommand.note,
      userId: addRequestCommand.callerId,
      buildingId: addRequestCommand.buildingId,
      request: addRequestCommand
    } as OfferRequestCreated)
  }

  assertValidCommand (command) {
    const validation = validate(command, AddOfferRequestCommand)
    if (!validation.isValid()) {
      throw new InvalidCommand(validation.errors)
    }
  }
}
