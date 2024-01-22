import * as TE from 'fp-ts/TaskEither'
import { BuildingReadModel } from '../repository/buildings-read.repository'
import { CouchbaseBuildingsReadRepository } from "../repository/couchbase-buildings-read.repository";

export interface ByCadastreReferenceCommand {
  cadastreReference: string
}

export class BuildingSearcherService {
  constructor (
    private couchbaseBuildingsReadRepository: CouchbaseBuildingsReadRepository,
  ) {
  }

  byCadastreReference (cmd: ByCadastreReferenceCommand): TE.TaskEither<Error, BuildingReadModel | undefined> {
    return this.couchbaseBuildingsReadRepository.ofCadastreReference(cmd.cadastreReference)
  }
}
