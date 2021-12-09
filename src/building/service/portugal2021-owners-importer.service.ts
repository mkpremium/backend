import * as TE from 'fp-ts/TaskEither'

export interface ImportOwnersOfCommand {
}

export class Portugal2021OwnersImporterService {
  importOwnersOf (cmd: ImportOwnersOfCommand): TE.TaskEither<Error, void> {
    throw new Error('Not implemented')
  }
}
