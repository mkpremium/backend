import * as TE from 'fp-ts/TaskEither'

export interface ImportSlugCommand {
}

export class Portugal2021BuildingsImporterService {
  importSlug (cmd: ImportSlugCommand): TE.TaskEither<Error, void> {
    throw new Error('Not implemented')
  }
}
