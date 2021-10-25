import * as TE from 'fp-ts/TaskEither'

export interface LeadsForCommand {
}

interface Lead {
}

export class FlipperLeadsService {
  leadsFor (cmd: LeadsForCommand): TE.TaskEither<Error, Lead> {
    throw new Error('Not implemented')
  }
}
