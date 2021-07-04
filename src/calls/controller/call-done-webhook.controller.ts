import { Logger } from 'winston'
import { VirtualCallsRepository } from '../repository/virtual-calls.repository'
import { CallStatus, VirtualAgentCall } from '../virtual-agent-call'
import { EventBus } from '../../infrastructure/event-bus'

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

export const createCallDoneWebhookController = ({
                                                  logger,
                                                  virtualCallsRepository,
                                                  eventBus,
                                                }: {
  logger: Logger,
  virtualCallsRepository: VirtualCallsRepository,
  eventBus: EventBus,
}) => {
  return async (req, res) => {
    const { callId } = req.params
    const { CallStatus: twilioCallStatus } = req.body
    virtualCallsRepository.get(callId)
      .then(async call => {
        let status = mapTwilioStatus(twilioCallStatus)
        if (!status) {
          logger.error('Call finished with unexpected status', { callId, status: twilioCallStatus })
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
        if (!updatedCall.ownerResponse) {
          logger.info('Call finished without input gathered', { callId })
        }

        await virtualCallsRepository.save(updatedCall)
        await eventBus.publish({
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
      })
      .then(() => res.sendStatus(200))
      .catch(error => logger.error('Saving call done', { error: error.message }))
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
