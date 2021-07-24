import { VirtualCallsRepository } from '../repository/virtual-calls.repository'
import { Twilio } from 'twilio'
import VoiceResponse from 'twilio/lib/twiml/VoiceResponse'
import { VirtualAgentCall, VirtualAgentCallProps } from '../virtual-agent-call'
import { WorksheetBuildingAddressProps } from '../../worksheet/repository/worksheet.repository'
import { OwnerContact } from './virtual-caller.service'
import retry from 'bluebird-retry'
import { VirtualCallerProps } from '../domain/virtual-caller'

type AddressParam = Pick<WorksheetBuildingAddressProps, 'street' | 'number' | 'city'>

export interface CallCommand {
  buildingId: string;
  caller: VirtualCallerProps
  address: AddressParam;
  contact: OwnerContact;
  worksheetId: string;
}

export class NumberAlreadyCalled implements Error {
  message = 'Phone number already called'
  name = 'NumberAlreadyCalled'

  constructor (
    readonly previousCall: VirtualAgentCallProps,
    readonly newContact: { contactId: string, ownerId: string }
  ) {
  }
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

    const to = this.ownerTrialPhoneNumber || '+34' + contact.value
    const lastCallToNumber = await this.virtualCallsRepository.lastCallToNumber(to)
    if (lastCallToNumber) {
      throw new NumberAlreadyCalled(lastCallToNumber, { contactId: cmd.contact.id, ownerId: contact.ownerId })
    }
    const call = await this.saveCall(cmd, to)

    const phoneLock = await this.getPhoneLock()
    return this.doCall(address, buildingId, worksheetId, contact, call, to)
      .finally(() => this.virtualCallsRepository.unlockPhone(this.virtualCallerPhoneNumber, phoneLock))
  }

  private getPhoneLock () {
    return retry<any>(
      () => this.virtualCallsRepository.lockPhone(this.virtualCallerPhoneNumber),
      { backoff: 2 }
    ).catch(error => {
      error.context = 'Locking phone'
      throw error
    })
  }

  private doCall (
    address: AddressParam,
    buildingId: string,
    worksheetId: string,
    contact: OwnerContact,
    call: VirtualAgentCallProps,
    to: string
  ) {
    return this.twilioClient.calls.create({
      twiml: this.createContactMessage(address, buildingId, worksheetId, contact, call.id).toString(),
      callerId: this.virtualCallerPhoneNumber,
      from: this.virtualCallerPhoneNumber,
      to: to,
      machineDetection: 'Enable',
      asyncAmd: 'true',
      asyncAmdStatusCallbackMethod: 'POST',
      asyncAmdStatusCallback: `${this.publicUrl}/calls/twilio/${(call.id)}/machine-detection`,
      statusCallback: `${this.publicUrl}/calls/twilio/${(call.id)}/done`
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

  private async saveCall (cmd: CallCommand, to: string) {
    const call = VirtualAgentCall({
      callerId: cmd.caller.id,
      worksheetId: cmd.worksheetId,
      contactId: cmd.contact.id,
      ownerId: cmd.contact.ownerId,
      phoneNumber: to,
      createdAt: new Date(),
    } as VirtualAgentCallProps)
    await this.virtualCallsRepository.save(call)

    return call
  }

  private createContactMessage (address: AddressParam, buildingId: string, worksheetId: string, contact: OwnerContact, callId: string) {
    const twiml = new VoiceResponse()
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
    ].map(([ key, value ]) => `${key}=${value}`).join('&')

    twiml.gather({
      action: `${this.publicUrl}/calls/twilio/${callId}/gather?${gatherEndpointQueryParams}`,
      method: 'POST',
      language: 'es-ES',
      numDigits: 1,
    }).say(this.twilioSayAttributes, message)
    return twiml
  }
}
