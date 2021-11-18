import { CallStatus, VirtualAgentCall } from '../virtual-agent-call'
import { VirtualCallsRepository } from '../repository/virtual-calls.repository'
import { EventPublisher } from '../../infrastructure/event-bus'
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
  error?: string;
}

interface ProcessCallFinishedCommand {
  callId: string
  twilioCallStatus: 'completed' | 'failed' | 'no-answer' | 'busy'
  error: {
    twilioErrorMessage: string
    sipResponseCode: string
    errorCode: string
  }
}

export const PHONE_DOES_NOT_EXIST = 'phone does not exist'

export class CallFinishedProcessor {
  constructor (
    private virtualCallsRepository: VirtualCallsRepository,
    private eventBus: EventPublisher,
    private logger: Logger,
  ) {
  }

  process (cmd: ProcessCallFinishedCommand): TaskEither<Error, void> {
    const { callId, twilioCallStatus, error } = cmd
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
            },
            error: {
              $set: status === 'FAILED' && error.sipResponseCode === '404' ? PHONE_DOES_NOT_EXIST : undefined
            },
            errorContext: {
              $set: status === 'FAILED' ? error : undefined
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
            error: updatedCall.error,
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
