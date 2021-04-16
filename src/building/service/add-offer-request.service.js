import t from 'tcomb'
import { validate } from 'tcomb-validation'
import { InvalidCommand } from '../../infrastructure/invalid-command.error'

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

export class AddOfferRequestService {
  /**
   * @param {offerRequestsRepository} offerRequestsRepository
   * @param buildingsRepository
   * @param eventBus
   */
  constructor (offerRequestsRepository, buildingsRepository, eventBus) {
    this.offerRequestsRepository = offerRequestsRepository
    this.buildingsRepository = buildingsRepository
    this.eventBus = eventBus
  }

  async addOfferRequest (addRequestCommand) {
    this.assertValidCommand(addRequestCommand)

    const offerRequest = await this.offerRequestsRepository.add(addRequestCommand)
    await this.buildingsRepository.assignBuildingToAgent(addRequestCommand.buildingId, addRequestCommand.flipperId)

    this.eventBus.publish({
      name: 'offer-request.created',
      note: addRequestCommand.note,
      userId: addRequestCommand.callerId,
      buildingId: addRequestCommand.buildingId,
      request: offerRequest
    })
  }

  assertValidCommand (command) {
    const validation = validate(command, AddOfferRequestCommand)
    if (!validation.isValid()) {
      throw new InvalidCommand(validation.errors)
    }
  }
}
