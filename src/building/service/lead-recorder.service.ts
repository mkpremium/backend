import * as TE from 'fp-ts/TaskEither'

export interface RecordLeadCommand {
}

export class LeadRecorderService {
  recordLead (cmd: RecordLeadCommand): TE.TaskEither<Error, void> {
    throw new Error('Not implemented')
  }
}
