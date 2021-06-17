import { Logger } from 'winston'
import { VirtualCallsRepository } from '../virtual-calls.repository'

export const createCallDoneWebhookController = ({
                                                  logger,
                                                  virtualCallsRepository
                                                }: {
  logger: Logger,
  virtualCallsRepository: VirtualCallsRepository
}) => async (req, res) => {
  // TODO update call status.
  // TODO publish event.
  console.log('call done', req.body)
  const { callId } = req.params


  // const call = await virtualCallsRepository.get(callId)
  // const updatedCall = VirtualAgentCall.update(call, {
  //   status: ''
  // })


  res.sendStatus(200)
}
