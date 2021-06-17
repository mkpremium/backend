import VoiceResponse from 'twilio/lib/twiml/VoiceResponse'
import { VirtualAgentCall } from '../virtual-agent-call'
import { VirtualCallsRepository } from '../virtual-calls.repository'

export class OwnerResponseProcessorService {
  constructor (
    private virtualCallsRepository: VirtualCallsRepository,
    private twilioSayAttributes: VoiceResponse.SayAttributes,
  ) {
  }

  async process (callId: any, ownerResponse: string, fromCity: string): Promise<VoiceResponse> {
    await this.updateCallStatus(callId)

    const twiml = new VoiceResponse()
    if (ownerResponse === '1') {
      // VENDE
      twiml.say(
        this.twilioSayAttributes,
        `Perfecto, tomamos nota de que tiene intención de vender y en un plazo maximo de 24h le contactara el director ` +
        `de ${fromCity} para hablar con usted sobre su propiedad.  Gracias y buenos dias.`
      )
    } else if (ownerResponse === '2') {
      // NO VENDE
      twiml.say(
        this.twilioSayAttributes,
        'Perfecto, tomamos nota de que no tiene intención de vender, disculpe las molestias, buenos dias.'
      )
    } else if (ownerResponse === '3') {
      // BORRAR CONTACTO
      twiml.say(
        this.twilioSayAttributes,
        'Gracias por su respuesta y perdón por las molestias.'
      )
    } else {
      twiml.say(
        this.twilioSayAttributes,
        'Ha seleccionado una opción no valida, gracias por su respuesta y perdón por las molestias.'
      )
    }

    return twiml
  }

  private async updateCallStatus (callId: any) {
    const call = await this.virtualCallsRepository.get(callId)
    const updatedCall = VirtualAgentCall.update(call, {
      status: {
        $set: 'INPUT_GATHERED'
      },
      gatheredAt: {
        $set: new Date()
      }
    })

    await this.virtualCallsRepository.save(updatedCall)
  }
}
