import { TaskEither } from 'fp-ts/TaskEither'
import VoiceResponse from 'twilio/lib/twiml/VoiceResponse'

export class IncomingCallProcessor {
  process (cmd: { from: string }): TaskEither<Error, VoiceResponse> {
    throw new Error('not implemented')
  }
}
