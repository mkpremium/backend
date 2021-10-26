import { BuildingsRepository } from '../repository/buildings.repository'
import { constVoid, pipe } from 'fp-ts/function'
import { fromPromise } from '../../infrastructure/fp-utils'
import * as TE from 'fp-ts/TaskEither'
import { withCapturedLead } from '../building'

export interface RecordLeadCommand {
  buildingId: string
  worksheetId: string
  ownerId: string
  contactId: string
}

export class LeadRecorderService {
  constructor (
    private buildingsRepository: BuildingsRepository,
  ) {
  }

  recordLead (cmd: RecordLeadCommand): TE.TaskEither<Error, void> {
    return pipe(
      fromPromise(this.buildingsRepository.get(cmd.buildingId)),
      TE.chain(
        building => {
          if (building.lead) {
            return TE.of(constVoid)
          }

          return fromPromise(this.buildingsRepository.save(withCapturedLead(building, {
            ownerId: cmd.ownerId,
            contactId: cmd.contactId,
            worksheetId: cmd.worksheetId,
          })))
        }
      )
    )
  }
}
