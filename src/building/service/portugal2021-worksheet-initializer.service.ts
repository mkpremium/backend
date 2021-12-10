import * as TE from 'fp-ts/TaskEither'

export interface CreateWorksheetForCommand {
}

export class Portugal2021WorksheetInitializerService {
  createWorksheetFor (cmd: CreateWorksheetForCommand): TE.TaskEither<Error, void> {
    throw new Error('Not implemented')
  }
}
