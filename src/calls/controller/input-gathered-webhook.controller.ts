import { VirtualCallsRepository } from '../virtual-calls.repository'
import { VirtualAgentCall } from '../virtual-agent-call'
import VoiceResponse from 'twilio/lib/twiml/VoiceResponse'

export const createInputGatheredWebhookController = ({
                                                       virtualCallsRepository,
                                                       twilioSayAttributes
                                                     }: {
  virtualCallsRepository: VirtualCallsRepository,
  twilioSayAttributes: VoiceResponse.SayAttributes,
}) =>
  async (req, res) => {
    const { callId } = req.params
    console.log('gathered input', req.body)

    const call = await virtualCallsRepository.get(callId)
    const updatedCall = VirtualAgentCall.update(call, {
      status: {
        $set: 'INPUT_GATHERED'
      },
      finishedAt: {
        $set: new Date()
      }
    })
    await virtualCallsRepository.save(updatedCall)

    const selectedOption = req.body.Digits
    const twiml = new VoiceResponse()
    if (selectedOption === '1') {
      // VENDE
      twiml.say(
        twilioSayAttributes,
        'Perfecto "nombre", tomamos nota de que tiene intención de vender y en un plazo maximo de 24h le contactara el director de "ciudad" para hablar con usted sobre su propiedad.  Gracias y buenos dias.'
      )
    } else if (selectedOption === '2') {
      // NO VENDE
      twiml.say(
        twilioSayAttributes,
        'Perfecto "nombre", tomamos nota de que no tiene intención de vender, disculpe las molestias, buenos dias.'
      )
    } else if (selectedOption === '3') {
      // BORRAR CONTACTO
      twiml.say(
        twilioSayAttributes,
        'Gracias por su respuesta y perdón por las molestias.'
      )
    } else {
      twiml.say(
        twilioSayAttributes,
        'Ha seleccionado una opción no valida, gracias por su respuesta y perdón por las molestias.'
      )
    }

    res.send(twiml.toString())
  }
