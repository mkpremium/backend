import VoiceResponse from 'twilio/lib/twiml/VoiceResponse'
import { VirtualAgentCall } from '../virtual-agent-call'
import { VirtualCallsRepository } from '../repository/virtual-calls.repository'
import { Logger } from 'winston'
import { EventBus } from '../../infrastructure/event-bus'
import { CallLanguage, TwilioSayAttributes } from './call-attributes'

export enum OwnerResponse {
  SALE = '1',
  NO_SALE = '2',
  NOT_OWNER = '3',
}

interface OwnerResponseProcessCommand {
  callId: string
  buildingId: string
  ownerResponse: string
  fromCity: string
  contactId: string
  ownerId: string
  worksheetId: string
}

export interface InputGathered {
  name: 'virtual-caller.input_gathered'
  callId: string
  callerId: string
  ownerId: string
  worksheetId: string
  contactId: string
  ownerResponse: OwnerResponse | string
  buildingId: string
}

interface ProcessOwnerResponseCommand {
  callId: string
  contactId: string
  worksheetId: string
  ownerResponse: string
  language: CallLanguage
  ownerId: string
  fromCity: string
  buildingId: string
}

export class OwnerResponseProcessorService {
  constructor (
    private virtualCallsRepository: VirtualCallsRepository,
    private twilioSayAttributes: TwilioSayAttributes,
    private eventBus: EventBus,
    private logger: Logger,
  ) {
  }

  process (cmd: ProcessOwnerResponseCommand): VoiceResponse {
    this.saveOwnerResponse(cmd).catch(error => {
      this.logger.error('Saving owner response', { cmd, errorMessage: error.message })
    })

    const twiml = new VoiceResponse()
    const copies: Record<OwnerResponse | 'Invalid', Record<CallLanguage, string>> = {
      [ OwnerResponse.SALE ]: {
        'es-ES': `Perfecto, tomamos nota de que tiene intención de vender y en un plazo maximo de 24h le contactara ` +
          `el directorde %%CITY%% para hablar con usted sobre su propiedad.  Gracias y buenos dias.`,
        'pt-PT': `Perfeito, notamos que pretende vender e no prazo máximo de 24 horas o diretor da %%CITY%% entrará ` +
          `em contato para falar sobre o seu imóvel. Obrigado e bom dia.`
      },
      [ OwnerResponse.NO_SALE ]: {
        'es-ES': 'Gracias por su respuesta y perdón por las molestias.',
        'pt-PT': 'Perfeito, notamos que não pretende vender, desculpe o transtorno, bom dia.'
      },
      [ OwnerResponse.NOT_OWNER ]: {
        'es-ES': 'Gracias por su respuesta y perdón por las molestias.',
        'pt-PT': 'Obrigado pela sua resposta e desculpe o transtorno.'
      },
      'Invalid': {
        'es-ES': 'Ha seleccionado una opción no valida, gracias por su respuesta y perdón por las molestias.',
        'pt-PT': 'Você selecionou uma opção inválida, obrigado por sua resposta e desculpe pelo transtorno.'
      }
    }

    const sayAttribute = this.twilioSayAttributes[ cmd.language ]
    if (OwnerResponseProcessorService.validOptionResponse(cmd.ownerResponse)) {
      twiml.say(sayAttribute, copies[ cmd.ownerResponse as OwnerResponse ][ cmd.language ].replace('%%CITY%%', cmd.fromCity))
    } else {
      twiml.say(sayAttribute, copies[ 'Invalid' ][ cmd.language ])
    }

    return twiml
  }

  private static validOptionResponse (ownerResponse: string) {
    return [ OwnerResponse.SALE, OwnerResponse.NO_SALE, OwnerResponse.NOT_OWNER ].includes(ownerResponse as OwnerResponse)
  }

  private async saveOwnerResponse (cmd: OwnerResponseProcessCommand) {
    const { callId, ownerResponse, buildingId, contactId, ownerId, worksheetId } = cmd
    this.logger.info('Response from owner gathered', { callId, ownerResponse })

    const call = await this.virtualCallsRepository.get(callId)
    const updatedCall = VirtualAgentCall.update(call, {
      status: {
        $set: 'INPUT_GATHERED'
      },
      ownerResponse: {
        $set: ownerResponse,
      },
      gatheredAt: {
        $set: new Date()
      }
    })

    this.virtualCallsRepository.save(updatedCall)
      .catch(error => {
        this.logger.error('Saving owner response', { callId, ownerResponse, error: error.message })
      })

    const inputGatheredEvent: InputGathered = {
      name: 'virtual-caller.input_gathered',
      callerId: call.callerId,
      callId,
      ownerResponse,
      buildingId,
      contactId,
      ownerId,
      worksheetId,
    }

    this.eventBus.publish(inputGatheredEvent).catch(error => {
      this.logger.error('Publishing input gathered event', { error: error.message, callId, ownerResponse })
    })
  }
}
