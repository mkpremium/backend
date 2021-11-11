import * as TE from 'fp-ts/TaskEither'
import { BuildingReadModel, BuildingsReadRepository } from '../repository/buildings-read.repository'

export interface ByCadastreReferenceCommand {
  cadastreReference: string
}

export class BuildingSearcherService {
  constructor (
    private buildingsReadRepository: BuildingsReadRepository,
  ) {
  }

  byCadastreReference (cmd: ByCadastreReferenceCommand): TE.TaskEither<Error, BuildingReadModel | undefined> {
    return this.buildingsReadRepository.ofCadastreReference(cmd.cadastreReference)
  }
}
