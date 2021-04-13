import t from 'tcomb'
import { validate } from 'tcomb-validation'
import { InvalidCommand } from '../../infrastructure/invalid-command.error'

const AddEvaluationRequestCommand = t.struct({
  ownerId: t.String,
  destinationContactId: t.String,
  reporterContactId: t.String,
  buildingId: t.String,
  callerId: t.String,
  flipperId: t.String,
  worksheetId: t.String
})

export class AddEvaluationRequestService {
  /**
   * @param {EvaluationRequestsRepository} evaluationRequestsRepository
   * @param buildingsRepository
   * @param eventBus
   */
  constructor (evaluationRequestsRepository, buildingsRepository, eventBus) {
    this.evaluationRequestsRepository = evaluationRequestsRepository
    this.buildingsRepository = buildingsRepository
    this.eventBus = eventBus
  }

  async addEvaluationRequest (evaluationRequest) {
    this.assertValidCommand(evaluationRequest)

    const storedRequest = await this.evaluationRequestsRepository.add(evaluationRequest)
    await this.buildingsRepository.assignBuildingToAgent(evaluationRequest.flipperId)

    this.eventBus.publish({
      name: 'evaluation-request.created',
      request: storedRequest
    })
  }

  assertValidCommand (command) {
    const validation = validate(command, AddEvaluationRequestCommand)
    if (!validation.isValid()) {
      throw new InvalidCommand(validation.errors)
    }
  }
}
