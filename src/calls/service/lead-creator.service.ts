import * as TE from 'fp-ts/TaskEither'

export interface createLeadCommand {
}

export class LeadCreatorService {
  createLead (cmd: createLeadCommand): TE.TaskEither<Error, void> {
    throw new Error('Not implemented')
  }
}
