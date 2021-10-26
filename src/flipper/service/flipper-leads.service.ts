import * as TE from 'fp-ts/TaskEither'
import { map } from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/function'
import { BuildingReadModel, BuildingsReadRepository } from '../../building/repository/buildings-read.repository'

export interface LeadsForCommand {
  flipperId: string,
}

interface Lead {
  createdAt: Date
  worksheetId: string
  building: BuildingReadModel
  contactId: string
}

export class FlipperLeadsService {
  constructor (
    private buildingsReadRepository: BuildingsReadRepository,
  ) {
  }

  leadsFor (cmd: LeadsForCommand): TE.TaskEither<Error, Lead[]> {
    return pipe(
      this.buildingsReadRepository.assignedToFlipperAndWithStatus(cmd.flipperId, 'LEAD'),
      map(
        buildings => buildings.map(b => ({
          building: b,
          createdAt: b.lead.capturedAt,
          worksheetId: b.lead.worksheetId,
          contactId: b.lead.contactId,
        }))
      )
    )
  }
}
