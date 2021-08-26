import * as TE from 'fp-ts/TaskEither'
import VoiceResponse from 'twilio/lib/twiml/VoiceResponse'
import { VirtualCallsRepository } from '../repository/virtual-calls.repository'
import { pipe } from 'fp-ts/function'
import { GatherOwnerInterestMessageComposer } from './gather-owner-interest-message-composer'
import { WorksheetRepository, WorksheetViewProps } from '../../worksheet/repository/worksheet.repository'
import { VirtualAgentCallProps } from '../virtual-agent-call'

export class IncomingCallProcessor {
  constructor (
    private virtualCallsRepository: VirtualCallsRepository,
    private gatherOwnerInterestMessageComposer: GatherOwnerInterestMessageComposer,
    private worksheetRepository: WorksheetRepository,
  ) {
  }

  process (cmd: { from: string }): TE.TaskEither<Error, VoiceResponse> {
    return pipe(
      this.virtualCallsRepository.lastCallTo(cmd.from),
      TE.chain(lastCall => {
        if (!lastCall) {
          return TE.of(undefined)
        }

        return TE.tryCatch(
          () => this.worksheetRepository.getForCallcenterView(lastCall.worksheetId).then(ws => [ lastCall, ws ]),
          reason => new Error(String(reason)),
        )
      }),
      TE.map((pair: [ VirtualAgentCallProps, WorksheetViewProps ] | undefined) => {
        if (pair === undefined) {
          return IncomingCallProcessor.rejectCall()
        }

        const [ lastCall, ws ] = pair
        return this.gatherOwnerInterestMessageComposer.compose({
          address: ws.building.address,
          buildingId: ws.building.id,
          callId: lastCall.id, // TODO is this OK?
          contact: {
            id: lastCall.id,
            ownerId: lastCall.ownerId,
          },
          language: cmd.from.startsWith('+351') ? 'pt-PT' : 'es-ES',
          worksheetId: ws.id,
        })
      })
    )
  }

  private static rejectCall () {
    const response = new VoiceResponse()
    response.reject()
    return response
  }
}
