import { FullAddress } from './full-address'
import { CallLanguage, TwilioSayAttributes } from './call-attributes'
import VoiceResponse, { GatherLanguage } from 'twilio/lib/twiml/VoiceResponse'

export interface GatherInterestMessageComposeCommand {
  readonly address: FullAddress
  readonly buildingId: string
  readonly worksheetId: string
  readonly contact: {
    id: string
    ownerId: string
  }
  readonly callId: string
  readonly language: CallLanguage
}

export class GatherOwnerInterestMessageComposer {
  constructor (
    private publicUrl: string,
    private twilioSayAttributes: TwilioSayAttributes,
  ) {
  }

  compose (cmd: GatherInterestMessageComposeCommand): VoiceResponse {
    const {
      address,
      buildingId,
      worksheetId,
      contact,
      callId,
      language,
    } = cmd
    const twiml = new VoiceResponse()
    twiml.pause({ length: 2 })
    const message = GatherOwnerInterestMessageComposer.composeMessage(address, language)

    const gatherEndpointQueryParams = [
      [ 'buildingId', buildingId ],
      [ 'fromCity', encodeURIComponent(address.city) ],
      [ 'worksheetId', worksheetId ],
      [ 'contactId', contact.id ],
      [ 'ownerId', contact.ownerId ],
      [ 'language', language ],
    ].map(([ key, value ]) => `${key}=${value}`).join('&')

    twiml.gather({
      action: `${this.publicUrl}/calls/twilio/${callId}/gather?${gatherEndpointQueryParams}`,
      method: 'POST',
      language: language as GatherLanguage,
      numDigits: 1,
      timeout: 10,
    }).say(this.twilioSayAttributes[ language ], message)

    return twiml
  }

  private static composeMessage (address: FullAddress, language: 'es-ES' | 'pt-PT') {
    const fullAddress = `${address.street} ${address.number}`
    if (language === 'es-ES') {
      return `${fullAddress}. Buenos días, le contactamos por su propiedad de ${fullAddress} de ${address.city}` +
        ', nos dedicamos a la compra patrimonial de inmuebles, ¿estaría usted interesado en vender?' +
        'Si desea vender marque 1, si no desea vender marque 2 y si no es el propietario marque 3.'
    } else if (language === 'pt-PT') {
      return `${fullAddress}. Bom dia, entramos em contato com você sobre a sua propiedade de ${fullAddress} de ${address.city}.` +
        'Estamos empenhados em comprar ativos imobiliários, você estaria interessado em vender? ' +
        'Se você quer vender, marque 1, se não quiser vender, marque 2, e se você não for o dono, marque 3.'
    } else {
      throw new Error(`Unsupported language ${language}`)
    }
  }
}
