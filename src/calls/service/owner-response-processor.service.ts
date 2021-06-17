import VoiceResponse from 'twilio/lib/twiml/VoiceResponse'
import { VirtualAgentCall } from '../virtual-agent-call'
import { VirtualCallsRepository } from '../virtual-calls.repository'
import { Logger } from 'winston'

enum States {
  SALE = '1',
  NO_SALE = '2',
  NOT_OWNER = '3',
}

export class OwnerResponseProcessorService {
  constructor (
    private virtualCallsRepository: VirtualCallsRepository,
    private twilioSayAttributes: VoiceResponse.SayAttributes,
    private logger: Logger,
  ) {
  }

  async process (callId: any, ownerResponse: string, fromCity: string): Promise<VoiceResponse> {
    this.updateCallStatus(callId, ownerResponse)

    const twiml = new VoiceResponse()
    switch (ownerResponse) {
      case States.SALE:
        twiml.say(
          this.twilioSayAttributes,
          `Perfecto, tomamos nota de que tiene intención de vender y en un plazo maximo de 24h le contactara el director ` +
          `de ${fromCity} para hablar con usted sobre su propiedad.  Gracias y buenos dias.`
        )
        break
      case States.NO_SALE:
        twiml.say(
          this.twilioSayAttributes,
          'Perfecto, tomamos nota de que no tiene intención de vender, disculpe las molestias, buenos dias.'
        )
        break
      case States.NOT_OWNER:
        twiml.say(
          this.twilioSayAttributes,
          'Gracias por su respuesta y perdón por las molestias.'
        )
        break
      default:
        twiml.say(
          this.twilioSayAttributes,
          'Ha seleccionado una opción no valida, gracias por su respuesta y perdón por las molestias.'
        )
    }

    return twiml
  }

  private updateCallStatus (callId: any, ownerResponse: string) {
    this.logger.info('Response from owner gathered', { callId, ownerResponse })
    this.virtualCallsRepository.get(callId)
      .then(call => {
        const updatedCall = VirtualAgentCall.update(call, {
          status: {
            $set: 'INPUT_GATHERED'
          },
          gatheredAt: {
            $set: new Date()
          }
        })

        this.virtualCallsRepository.save(updatedCall)
          .catch(error => {
            this.logger.error('Saving owner response', { callId, ownerResponse, error: error.message })
          })
      })
      .catch(error => {
        this.logger.error('Getting call', { callId, ownerResponse, error: error.message })
      })
  }
}
