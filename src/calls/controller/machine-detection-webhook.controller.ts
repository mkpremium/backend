import VoiceResponse from 'twilio/lib/twiml/VoiceResponse'
import { MachineDetectionResultProcessorService } from '../service/machine-detection-result-processor.service'

export const createMachineDetectionWebhookController = ({ machineDetectionResultProcessor }: { machineDetectionResultProcessor: MachineDetectionResultProcessorService }) => async (req, res) => {
  const answeredBy = req.body.AnsweredBy
  const { callId } = req.params

  return machineDetectionResultProcessor.process(callId, answeredBy)
    .then(isHuman => {
      if (!isHuman) {
        const twiml = new VoiceResponse()
        twiml.hangup()
        res.send(twiml.toString())
      } else {
        res.sendStatus(200)
      }
    })
}
