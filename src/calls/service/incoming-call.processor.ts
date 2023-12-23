import * as TE from 'fp-ts/TaskEither'
import VoiceResponse from 'twilio/lib/twiml/VoiceResponse'
import { VirtualCallsRepository } from '../repository/virtual-calls.repository'
import { pipe } from 'fp-ts/function'
import { GatherOwnerInterestMessageComposer } from './gather-owner-interest-message-composer'
import { WorksheetViewProps } from '../../worksheet/repository/worksheet.repository'
import { VirtualAgentCallProps } from '../virtual-agent-call'
import { CallcenterWorksheetService } from '../../worksheet/service/callcenter-worksheet.service'

export class IncomingCallProcessor {
  constructor (
    private virtualCallsRepository: VirtualCallsRepository,
    private gatherOwnerInterestMessageComposer: GatherOwnerInterestMessageComposer,
    private callcenterWorksheetService: CallcenterWorksheetService,
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
          () => this.callcenterWorksheetService.getWorksheetForCallcenterView(lastCall.worksheetId).then(ws => [ lastCall, ws ]),
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
          callId: lastCall.id,
          contact: {
            id: lastCall.contactId,
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
