import { VirtualCallsRepository } from '../virtual-calls.repository'
import { Twilio } from 'twilio'
import VoiceResponse from 'twilio/lib/twiml/VoiceResponse'
import { VirtualAgentCall, VirtualAgentCallProps } from '../virtual-agent-call'
import { WorksheetBuildingAddressProps } from '../../worksheet/repository/worksheet.repository'
import { OwnerContact } from './virtual-caller.service'

type AddressParam = Pick<WorksheetBuildingAddressProps, 'street' | 'number' | 'city'>

interface CallCommand {
  buildingId: string;
  address: AddressParam;
  contact: OwnerContact;
  worksheetId: string;
}

export class VirtualCallerPhone {
  constructor (
    private twilioClient: Twilio,
    private publicUrl: string,
    private virtualCallsRepository: VirtualCallsRepository,
    private twilioSayAttributes: VoiceResponse.SayAttributes,
    private virtualCallerPhoneNumber: string,
    private ownerTrialPhoneNumber?: string,
  ) {
  }

  async call (cmd: CallCommand) {
    const { worksheetId, contact, address, buildingId } = cmd
    const twiml = new VoiceResponse()
    const call = VirtualAgentCall({
      worksheetId,
      contactId: contact.id,
      ownerId: contact.ownerId,
    } as VirtualAgentCallProps)
    await this.virtualCallsRepository.save(call)

    twiml.pause({ length: 1 })
    const message = `Buenos dias, le contactamos por su propiedad de ${address.street} ${address.number} de ${address.city}` +
      ', nos dedicamos a la compra patrimonial de inmuebles, estaria usted interesado en vender?' +
      'Si desea vender marque 1, si no desea vender marque 2 y si no es el propietario marque 3.'

    const gatherEndpointQueryParams = [
      [ 'buildingId', buildingId ],
      [ 'fromCity', encodeURIComponent(address.city) ],
      [ 'worksheetId', worksheetId ],
      [ 'contactId', contact.id ],
      [ 'ownerId', contact.ownerId ],
    ].map(([key, value]) => `${key}=${value}`).join('&')

    twiml.gather({
      action: `${this.publicUrl}/calls/twilio/${call.id}/gather?${gatherEndpointQueryParams}`,
      method: 'POST',
      language: 'es-ES',
      numDigits: 1,
    }).say(this.twilioSayAttributes, message)

    return this.twilioClient.calls.create({
      twiml: twiml.toString(),
      callerId: this.virtualCallerPhoneNumber,
      from: this.virtualCallerPhoneNumber,
      to: this.ownerTrialPhoneNumber || '+34' + contact.value,
      machineDetection: 'Enable',
      asyncAmd: 'true',
      asyncAmdStatusCallbackMethod: 'POST',
      asyncAmdStatusCallback: `${this.publicUrl}/calls/twilio/${call.id}/machine-detection`,
      statusCallback: `${this.publicUrl}/calls/twilio/${call.id}/done`
    })
      .catch(error => {
        const updatedCall = VirtualAgentCall.update(call, {
          status: {
            $set: 'FAILED'
          },
          error: {
            $set: error.message
          }
        })
        this.virtualCallsRepository.save(updatedCall)
        throw error
      })
  }

  private async callPoc (from: string, to: string) {
    const twiml = new VoiceResponse()
    const call = VirtualAgentCall({} as VirtualAgentCallProps)
    await this.virtualCallsRepository.save(call)

    twiml.pause({
      length: 1,
    })
    twiml.gather({
      action: `${this.publicUrl}/calls/twilio/${call.id}/gather`,
      method: 'POST',
      language: 'es-ES',
      numDigits: 1,
    }).say(this.twilioSayAttributes,
      'Buenos dias, le contactamos por su propiedad de la calle Espaseria 2 de ' +
      'Barcelona, nos dedicamos a la compra patrimonial de inmuebles, estaria usted interesado en vender?' +
      'Si desea vender marque 1, si no desea vender marque 2 y si no es el propietario marque 3.'
    )

    return this.twilioClient.calls.create({
      twiml: twiml.toString(),
      callerId: from,
      from,
      to,
      machineDetection: 'Enable',
      asyncAmd: 'true',
      asyncAmdStatusCallbackMethod: 'POST',
      asyncAmdStatusCallback: `${this.publicUrl}/calls/twilio/${call.id}/machine-detection`,
      statusCallback: `${this.publicUrl}/calls/twilio/${call.id}/done`
    })
      .catch(error => {
        const updatedCall = VirtualAgentCall.update(call, {
          status: {
            $set: 'FAILED'
          },
          error: {
            $set: error.message
          }
        })
        this.virtualCallsRepository.save(updatedCall)
        throw error
      })
  }
}
