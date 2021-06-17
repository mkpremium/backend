import VoiceResponse from 'twilio/lib/twiml/VoiceResponse'
import { MachineDetectionResponseProcessorService } from '../service/machine-detection-response-processor.service'

export const createMachineDetectionWebhookController = ({ machineDetectionResponseProcessor }: { machineDetectionResponseProcessor: MachineDetectionResponseProcessorService }) => async (req, res) => {
  const answeredBy = req.body.AnsweredBy
  const { callId } = req.params

  return machineDetectionResponseProcessor.process(callId, answeredBy)
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
