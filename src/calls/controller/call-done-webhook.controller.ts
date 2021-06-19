import { Logger } from 'winston'
import { VirtualCallsRepository } from '../repository/virtual-calls.repository'
import { VirtualAgentCall } from '../virtual-agent-call'
import { EventBus } from '../../infrastructure/event-bus'

export interface CallDone {
  name: 'virtual-caller.call_finished';
  callId: string;
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
    virtualCallsRepository.get(callId)
      .then(async call => {
        const updatedCall = VirtualAgentCall.update(call, {
          status: {
            $set: 'DONE'
          },
          doneAt: {
            $set: new Date()
          }
        })
        if (!updatedCall.ownerResponse) {
          logger.info('Call finished without input gathered', { callId })
        }

        await virtualCallsRepository.save(updatedCall)
        await eventBus.publish({
          name: 'virtual-caller.call_finished',
          callId
        } as CallDone)
      })
      .then(() => res.sendStatus(200))
      .catch(error => logger.error('Saving call done', { error: error.message }))
  }
}
