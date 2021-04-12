import t from 'tcomb'
import { validate } from 'tcomb-validation'
import { InvalidCommand } from '../../infrastructure/invalid-command.error'

const AddEvaluationRequestCommand = t.struct({
  ownerId: t.String,
  destinationContactId: t.String,
  reporterContactId: t.String,
  buildingId: t.String,
  flipperId: t.String,
  worksheetId: t.String
})

export class AddEvaluationRequestService {
  constructor (evaluationRequestsRepository, buildingsRepository) {
    this.evaluationRequestsRepository = evaluationRequestsRepository
    this.buildingsRepository = buildingsRepository
  }

  async addEvaluationRequest (command) {
    this.assertValidCommand(command)

    await this.evaluationRequestsRepository.add(command)
    await this.buildingsRepository.assignBuildingToAgent(command.notifyTo)
  }

  assertValidCommand (command) {
    const validation = validate(command, AddEvaluationRequestCommand)
    if (!validation.isValid()) {
      throw new InvalidCommand(validation.errors)
    }
  }
}
