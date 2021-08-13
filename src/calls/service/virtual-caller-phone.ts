import { VirtualCallsRepository } from '../repository/virtual-calls.repository'
import { Twilio } from 'twilio'
import VoiceResponse, { GatherLanguage } from 'twilio/lib/twiml/VoiceResponse'
import { VirtualAgentCall, VirtualAgentCallProps } from '../virtual-agent-call'
import { WorksheetBuildingAddressProps } from '../../worksheet/repository/worksheet.repository'
import { OwnerContact } from './virtual-caller.service'
import retry from 'bluebird-retry'
import { Timezone, VirtualCallerProps } from '../domain/virtual-caller'
import honeycomb from 'honeycomb-beeline'
import { CallLanguage, TwilioSayAttributes } from './call-attributes'
import moment from 'moment'
import { ContactProps } from '../../owner/owner'
import { Logger } from 'winston'
import { LockedPhone, VirtualCallerPhonesRepository } from '../repository/virtual-caller-phones.repository'
import { phoneBusy } from '../domain/caller.phone'

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

const localizationByTimezone: Record<Timezone, { prefix: string; language: CallLanguage }> = {
  'Europe/Madrid': {
    language: 'es-ES',
    prefix: '+34',
  },
  'Europe/Lisbon': {
    language: 'pt-PT',
    prefix: '+351',
  },
}

const FREEZER_LENGTH_MONTHS = 3
export const lockingPhoneErrorContext = 'Locking phone'

export class VirtualCallerPhone {
  constructor (
    private twilioClient: Twilio,
    private publicUrl: string,
    private virtualCallsRepository: VirtualCallsRepository,
    private twilioSayAttributes: TwilioSayAttributes,
    private virtualCallerPhonesRepository: VirtualCallerPhonesRepository,
    private logger: Logger,
    private ownerTrialPhoneNumber?: string,
  ) {
  }

  async call (cmd: CallCommand) {
    const { worksheetId, contact, address, buildingId } = cmd

    const localization = localizationByTimezone[ cmd.caller.timezone ]
    const to = this.ownerTrialPhoneNumber || localization.prefix + contact.value
    const lockedPhone = await this.getPhoneLock(cmd.caller.phoneNumber)
    const call = this.createCall(cmd, to)

    return this.assertPhoneNotCalledYet(to, contact)
      .then(() => this.doCall(address, buildingId, worksheetId, contact, call, cmd.caller.phoneNumber, to, localization.language))
      .catch(async error => {
        await this.virtualCallerPhonesRepository.unlockPhone(cmd.caller.phoneNumber, lockedPhone.cas)
        await this.virtualCallsRepository.save(VirtualAgentCall.update(call, {
          status: {
            $set: 'FAILED',
          },
          error: {
            $set: error.message
          }
        }))
        throw error
      })
      .then(async () => {
        await this.saveCall(call)
        return this.virtualCallerPhonesRepository.saveWithLock({
          cas: lockedPhone.cas,
          phone: phoneBusy(lockedPhone.phone)
        })
      })
  }

  private async assertPhoneNotCalledYet (to: string, contact: ContactProps & { ownerId: string }) {
    const lastCallToNumber = await this.virtualCallsRepository.lastCallToNumber(to)
    if (!lastCallToNumber || VirtualCallerPhone.ownerUnreached(lastCallToNumber) || VirtualCallerPhone.fromFreezer(lastCallToNumber)) {
      return
    }

    if (lastCallToNumber.ownerResponse || moment(lastCallToNumber.createdAt).isSame(moment(), 'day')) {
      throw new NumberAlreadyCalled(lastCallToNumber, { contactId: contact.id, ownerId: contact.ownerId })
    }
  }

  private static ownerUnreached (lastCallToNumber: VirtualAgentCallProps) {
    return [ 'FAILED', 'BUSY', 'NO_ANSWER' ].includes(lastCallToNumber.status)
  }

  private static fromFreezer (lastCallToNumber: VirtualAgentCallProps) {
    return moment(lastCallToNumber.createdAt).isBefore(moment().add(-FREEZER_LENGTH_MONTHS, 'months'))
  }

  private getPhoneLock (phoneNumber: string): Promise<LockedPhone> {
    return retry<LockedPhone>(
      () => this.virtualCallerPhonesRepository.lockPhone(phoneNumber),
      { backoff: 2 }
    ).then((lockedPhone) => {
      if (lockedPhone.phone.status === 'BUSY') {
        this.virtualCallerPhonesRepository.unlockPhone(phoneNumber, lockedPhone.cas)
          .catch(error => this.logger.error(`Couldn't unlock phone`, {
            errorMessage: error.message,
            phoneNumber,
          }))
        throw new Error(`Virtual caller phone is busy (${phoneNumber})`)
      }
      return lockedPhone
    }).catch(error => {
      error.context = lockingPhoneErrorContext
      throw error
    })
  }

  private doCall (
    address: AddressParam,
    buildingId: string,
    worksheetId: string,
    contact: OwnerContact,
    call: VirtualAgentCallProps,
    from: string,
    to: string,
    language: CallLanguage
  ) {
    const beeline = honeycomb()
    const callSpan = beeline.startSpan({ name: 'twilio_create_call' })

    return this.twilioClient.calls.create({
      twiml: this.createContactMessage(address, buildingId, worksheetId, contact, call.id, language).toString(),
      callerId: from,
      from: from,
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
      .finally(() => beeline.finishSpan(callSpan))
  }

  private async saveCall (call) {
    await this.virtualCallsRepository.save(call)
  }

  private createCall (cmd: CallCommand, to: string) {
    return VirtualAgentCall({
      callerId: cmd.caller.id,
      worksheetId: cmd.worksheetId,
      contactId: cmd.contact.id,
      ownerId: cmd.contact.ownerId,
      phoneNumber: to,
      createdAt: new Date(),
    } as VirtualAgentCallProps)
  }

  private createContactMessage (
    address: AddressParam,
    buildingId: string,
    worksheetId: string,
    contact: OwnerContact,
    callId: string,
    language: CallLanguage
  ) {
    const twiml = new VoiceResponse()
    twiml.pause({ length: 1 })
    const message = VirtualCallerPhone.composeMessage(address, language)

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
    }).say(this.twilioSayAttributes[ language ], message)
    return twiml
  }

  private static composeMessage (address: AddressParam, language: CallLanguage) {
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
