import { RequestHandler } from 'express'
import { IncomingCallProcessor } from '../service/incoming-call.processor'
import { isRight } from 'fp-ts/Either'
import * as TE from 'fp-ts/TaskEither'
import { Logger } from 'winston'
import { pipe } from 'fp-ts/lib/function'
import VoiceResponse from 'twilio/lib/twiml/VoiceResponse'

interface Deps {
  incomingCallProcessor: IncomingCallProcessor
  logger: Logger
}

export function twilioIncomingCallController ({ incomingCallProcessor, logger }: Deps): RequestHandler {
  return async function (req, res) {
    const { From, CallSid } = req.body
    await pipe(
      incomingCallProcessor.process({ from: From, }),
      TE.match<Error, void, VoiceResponse>(
        error => {
          res.sendStatus(500)
          logger.error('Twilio call processo failed', {
            CallSid,
            error: { message: error.message, stack: error.stack }
          })
        },
        message => res.send(message.toString())
      )
    )()
  }
}
