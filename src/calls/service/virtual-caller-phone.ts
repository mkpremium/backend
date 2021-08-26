import { VirtualCallsRepository } from '../repository/virtual-calls.repository'
import { Twilio } from 'twilio'
import { VirtualAgentCall, VirtualAgentCallProps } from '../virtual-agent-call'
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
import { FullAddress } from './full-address'
import { NumberAlreadyCalled } from './number-already-called'
import { GatherOwnerInterestMessageComposer } from './gather-owner-interest-message-composer'
import { PHONE_DOES_NOT_EXIST } from './call-finished.processor'

export interface CallCommand {
  buildingId: string;
  caller: VirtualCallerProps
  address: FullAddress;
  contact: OwnerContact;
  worksheetId: string;
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

class NumberDoesNotExist extends Error {
  constructor (
    readonly ownerId: string,
    readonly contactId: string
  ) {
    super(`Number does not exist (ownerId=${ownerId} contactId${contactId})`)
  }
}

export class VirtualCallerPhone {
  constructor (
    private twilioClient: Twilio,
    private publicUrl: string,
    private virtualCallsRepository: VirtualCallsRepository,
    private virtualCallerPhonesRepository: VirtualCallerPhonesRepository,
    private gatherOwnerInterestMessageComposer: GatherOwnerInterestMessageComposer,
    private logger: Logger,
    private ownerTrialPhoneNumber?: string,
  ) {
  }

  async call (cmd: CallCommand) {
    const { worksheetId, contact, address, buildingId } = cmd

    const localization = localizationByTimezone[ cmd.caller.timezone ]
    const to = this.ownerTrialPhoneNumber || localization.prefix + contact.value
    const lockedPhone = await this.getPhoneLock(cmd.caller.phoneNumber)
    const call = VirtualCallerPhone.createCall(cmd, to)

    return this.assertPhoneNotCalledYet(to, contact, cmd.worksheetId)
      .then(() => this.doCall(address, buildingId, worksheetId, contact, call, cmd.caller.phoneNumber, to, localization.language))
      .catch(async error => {
        await this.virtualCallerPhonesRepository.unlockPhone(cmd.caller.phoneNumber, lockedPhone.cas)
        if (!(error instanceof NumberAlreadyCalled)) {
          await this.virtualCallsRepository.save(VirtualAgentCall.update(call, {
            status: {
              $set: 'FAILED',
            },
            error: {
              $set: error.message
            }
          }))
        }
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

  private async assertPhoneNotCalledYet (to: string, contact: ContactProps & { ownerId: string }, worksheetId: string) {
    const callsToNumber = await this.virtualCallsRepository.previousCallsToNumber(to)
    if (!callsToNumber) {
      return
    }
    callsToNumber.forEach(call => {
      if (call.error === PHONE_DOES_NOT_EXIST) {
        throw new NumberDoesNotExist(contact.ownerId, contact.id)
      }
      if (VirtualCallerPhone.ownerUnreached(call) || VirtualCallerPhone.fromFreezer(call)) {
        return
      }

      if ((call.worksheetId === worksheetId && call.ownerResponse) || moment(call.createdAt).isSame(moment(), 'day')) {
        throw new NumberAlreadyCalled(call, { contactId: contact.id, ownerId: contact.ownerId })
      }
    })
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
    address: FullAddress,
    buildingId: string,
    worksheetId: string,
    contact: OwnerContact,
    call: VirtualAgentCallProps,
    from: string,
    to: string,
    language: CallLanguage,
  ) {
    const beeline = honeycomb()
    const callSpan = beeline.startSpan({ name: 'twilio_create_call' })

    return this.twilioClient.calls.create({
      twiml: this.gatherOwnerInterestMessageComposer.compose({
        address,
        buildingId,
        worksheetId,
        contact,
        callId: call.id,
        language
      }).toString(),
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

  private static createCall (cmd: CallCommand, to: string) {
    return VirtualAgentCall({
      callerId: cmd.caller.id,
      worksheetId: cmd.worksheetId,
      contactId: cmd.contact.id,
      ownerId: cmd.contact.ownerId,
      phoneNumber: to,
      createdAt: new Date(),
    } as VirtualAgentCallProps)
  }
}
