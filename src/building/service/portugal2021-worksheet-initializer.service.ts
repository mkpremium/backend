import * as TE from 'fp-ts/TaskEither'
import { BuildingsRepository } from '../repository/buildings.repository'
import { Portugal2021BuildingsRepository } from '../repository/portugal2021-buildings.repository'
import { WorksheetRepository } from '../../worksheet/repository/worksheet.repository'
import { pipe } from 'fp-ts/function'
import { Worksheet } from '../../worksheet/domain/worksheet'
import uuid from 'uuid/v4'
import { fromPromise } from '../../infrastructure/fp-utils'

export interface CreateWorksheetForCommand {
  sourceBuildingId: string
}

export class Portugal2021WorksheetInitializerService {
  constructor (
    private portugal2021BuildingsRepository: Portugal2021BuildingsRepository,
    private buildingsRepository: BuildingsRepository,
    private worksheetRepository: WorksheetRepository
  ) {
  }

  createWorksheetFor (cmd: CreateWorksheetForCommand): TE.TaskEither<Error, void> {
    return pipe(
      this.portugal2021BuildingsRepository.get(cmd.sourceBuildingId),
      TE.chain(sourceBuilding => {
        return pipe(
          fromPromise(this.buildingsRepository.get(sourceBuilding.importedWithBuildingId)),
          TE.chain(building => {
            return fromPromise(
              this.worksheetRepository.save(Worksheet({
                id: uuid(),
                status: 'OPEN',
                relatedBuildingIds: [sourceBuilding.importedWithBuildingId],
                buildingAddress: building.address as any
              }))
            )
          }),
          TE.chain(() => this.portugal2021BuildingsRepository.save({
            ...sourceBuilding,
            status: 'WORKSHEET_CREATED'
          })
          ),
          TE.orElse(error => {
            this.portugal2021BuildingsRepository.save({
              ...sourceBuilding,
              failure: error.message,
              previousStatus: sourceBuilding.status,
              status: 'FAILED'
            })
            return TE.left(error)
          })
        )
      })
    )
  }
}
