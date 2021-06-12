import VoiceResponse from 'twilio/lib/twiml/VoiceResponse'

export const createMachineDetectionWebhookController = () => async (req, res) => {
  console.log('Machine detection result', req.body)
  if (req.body.AnsweredBy !== 'human') {
    const twiml = new VoiceResponse()
    twiml.hangup()
    res.send(twiml.toString())
  } else {
    res.sendStatus(200)
  }
}
