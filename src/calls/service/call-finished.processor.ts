import { CallStatus, VirtualAgentCall } from '../virtual-agent-call'
import { VirtualCallsRepository } from '../repository/virtual-calls.repository'
import { EventBus } from '../../infrastructure/event-bus'
import { Logger } from 'winston'
import { taskEither } from 'fp-ts'
import { TaskEither } from 'fp-ts/lib/TaskEither'

export interface CallDone {
  name: 'virtual-caller.call_finished';
  callerId: string;
  callId: string;
  status: CallStatus;
  phoneNumber: string;
  ownerId: string;
  contactId: string;
  worksheetId: string;
  ownerResponse: string;
}

interface ProcessCallFinishedCommand {
  callId: string
  twilioCallStatus: 'completed' | 'failed' | 'no-answer' | 'busy'
}

export class CallFinishedProcessor {
  constructor (
    private virtualCallsRepository: VirtualCallsRepository,
    private eventBus: EventBus,
    private logger: Logger,
  ) {
  }

  process (cmd: ProcessCallFinishedCommand): TaskEither<Error, void> {
    const { callId, twilioCallStatus } = cmd
    return taskEither.tryCatch(
      () => this.virtualCallsRepository.get(callId)
        .then(async call => {
          let status = mapTwilioStatus(twilioCallStatus)
          if (!status) {
            this.logger.error('Call finished with unexpected status', { callId, status: twilioCallStatus })
            status = 'DONE'
          }

          const updatedCall = VirtualAgentCall.update(call, {
            status: {
              $set: status
            },
            finishedAt: {
              $set: new Date()
            }
          })

          await this.virtualCallsRepository.save(updatedCall)
          await this.eventBus.publish({
            name: 'virtual-caller.call_finished',
            status,
            callId,
            callerId: call.callerId,
            phoneNumber: call.phoneNumber,
            ownerId: call.ownerId,
            contactId: call.contactId,
            worksheetId: call.worksheetId,
            ownerResponse: call.ownerResponse,
          } as CallDone)
        }),
      reason => reason instanceof Error ? reason : new Error(String(reason))
    )
  }
}

function mapTwilioStatus (twilioCallStatus: 'completed' | 'failed' | 'no-answer' | 'busy'): CallStatus {
  switch (twilioCallStatus) {
    case 'completed':
      return 'DONE'
    case 'failed':
      return 'FAILED'
    case 'no-answer':
      return 'NO_ANSWER'
    case 'busy':
      return 'BUSY'
  }
}
