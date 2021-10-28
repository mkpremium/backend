import { BuildingsRepository } from '../repository/buildings.repository'
import { constVoid, pipe } from 'fp-ts/function'
import { fromPromise } from '../../infrastructure/fp-utils'
import * as TE from 'fp-ts/TaskEither'
import { withCapturedLead } from '../building'
import { EventBus } from '../../infrastructure/event-bus'

export interface RecordLeadCommand {
  buildingId: string
  worksheetId: string
  ownerId: string
  contactId: string
  toFlipperId: string
}

export interface LeadCaptured {
  name: 'building.lead_captured'
  buildingId: string
  ownerId: string
  contactId: string
}

export class LeadRecorderService {
  constructor (
    private buildingsRepository: BuildingsRepository,
    private eventBus: EventBus,
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

          const lead = withCapturedLead(building, cmd.toFlipperId, {
            ownerId: cmd.ownerId,
            contactId: cmd.contactId,
            worksheetId: cmd.worksheetId,
          })
          return fromPromise(this.buildingsRepository.save(lead))
        }
      ),
      TE.chain(() => fromPromise(this.eventBus.publish({
        name: 'building.lead_captured',
        ...cmd,
      } as LeadCaptured)))
    )
  }
}
