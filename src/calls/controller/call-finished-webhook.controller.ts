import { Logger } from 'winston'
import { CallFinishedProcessor } from '../service/call-finished.processor'

export const callFinishedWebhookController = ({
                                                  logger,
                                                  callFinishedProcessor,
                                                }: {
  logger: Logger,
  callFinishedProcessor: CallFinishedProcessor,
}) => {
  return async (req, res) => {
    const { callId } = req.params
    const { CallStatus: twilioCallStatus } = req.body
    callFinishedProcessor.process({ callId, twilioCallStatus })()
      .then(() => res.sendStatus(200))
      .catch(error => {
        logger.error('Saving call done', { error: error.message })
        res.status(500).json({ error: error.message })
      })
  }
}
