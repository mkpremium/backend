import * as TE from 'fp-ts/TaskEither'
import { BuildingReadModel } from '../repository/buildings-read.repository'

export interface ByCadastreReferenceCommand {
}

export class BuildingSearcherService {
  byCadastreReference (cmd: ByCadastreReferenceCommand): TE.TaskEither<Error, BuildingReadModel> {
    throw new Error('Not implemented')
  }
}
