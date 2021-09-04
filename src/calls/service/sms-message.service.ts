import { Twilio } from 'twilio'
import { WorksheetRepository, WorksheetViewProps } from '../../worksheet/repository/worksheet.repository'
import { SmsMessagesRepository } from '../repository/sms-messages.repository'
import { chain, map, TaskEither } from 'fp-ts/TaskEither'
import { type, TypeOf } from 'io-ts'
import { taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import uuid from 'uuid/v4'
import { NonEmptyString } from 'io-ts-types'
import moment from 'moment'
import { BuildingOwnerPhonesRepository, LockedOwnerPhone } from '../repository/building-owner-phones.repository'

export const SendMessageToUnreachedOwnerCodec = type({
  to: NonEmptyString,
  callerId: NonEmptyString,
  contactId: NonEmptyString,
  ownerId: NonEmptyString,
  worksheetId: NonEmptyString,
})
export type SendMessageToUnreachedOwner = TypeOf<typeof SendMessageToUnreachedOwnerCodec>
const MAX_SMS_LENGTH = 160

export class SmsMessageSender {
  constructor (
    private twilioClient: Twilio,
    private worksheetRepository: WorksheetRepository,
    private smsMessagesRepository: SmsMessagesRepository,
    private buildingOwnerPhonesRepository: BuildingOwnerPhonesRepository,
  ) {
  }

  sendMessageToUnreachedOwner (cmd: SendMessageToUnreachedOwner): TaskEither<Error, void> {
    const lang = cmd.to.startsWith('+351') ? 'PT' : 'ES'
    let lockedOwnerPhone: LockedOwnerPhone
    const smsId = uuid()
    return pipe(
      this.assertNoSmsSentTodayToPhoneNumber(cmd.to),
      chain((lop) => {
        lockedOwnerPhone = lop
        return this.composeMessageWithAddress(lang, cmd.worksheetId)
      }),
      map<string, string>(messageWithAddress =>
        messageWithAddress.length < MAX_SMS_LENGTH ? messageWithAddress : SmsMessageSender.messageWithoutAddress(lang)
      ),
      chain((body: string) =>
        taskEither.tryCatch(
          () => this.twilioClient.messages.create({
            body,
            from: '+351965965374',
            to: cmd.to,
          }).then(),
          reason => reason instanceof Error ? reason : new Error(String(reason))
        ),
      ),
      chain(() => this.buildingOwnerPhonesRepository.save({
        ...lockedOwnerPhone.ownerPhone,
        lastSmsSentAt: new Date(),
        lastSmsSentId: smsId,
      }, lockedOwnerPhone.cas)),
      chain(() => this.smsMessagesRepository.addOutgoing({
        id: smsId,
        createdAt: new Date(),
        ...cmd,
      })),
    )
  }

  private composeMessageWithAddress (lang: string, worksheetId: string): TaskEither<Error, string> {
    return pipe(
      taskEither.tryCatch<Error, WorksheetViewProps>(
        () => this.worksheetRepository.getForCallcenterView(worksheetId),
        reason => reason instanceof Error ? reason : new Error(String(reason))
      ),
      map(worksheet => {
        const { street, number, city } = worksheet.building.address
        const message = lang === 'PT' ?
          'Olá, eu chamei você para o seu imóvel do %%address%%. Se você está interessado em vender, ligue para este mesmo número. Obrigado.' :
          'Hola, le he llamado por su propiedad de la %%address%%. Si le interesa vender por favor llame a este mismo número. Gracias.'

        return message.replace('%%address%%', `${street} ${number} de ${city}`)
      }))
  }

  private static messageWithoutAddress (lang: string): string {
    return lang === 'PT' ?
      'Olá, eu liguei para você sobre sua propriedade. Se você está interessado em vender, ligue para este mesmo número. Obrigado.' :
      'Hola, le he llamado por su propiedad. Si le interesa vender por favor llame a este mismo número. Gracias.'
  }

  private assertNoSmsSentTodayToPhoneNumber (to: string): TaskEither<WeeklySmsAlreadySent | Error, LockedOwnerPhone> {
    return pipe(
      this.buildingOwnerPhonesRepository.getByPhoneNumberAndLock(to),
      chain(({ ownerPhone, cas }) => {
        const previousWeek = moment().add(-1, 'week')
        if (moment(ownerPhone.lastSmsSentAt).isAfter(previousWeek, 'day')) {
          return taskEither.left(new WeeklySmsAlreadySent(to))
        }
        return taskEither.of({ ownerPhone, cas })
      })
    )
  }
}

class WeeklySmsAlreadySent extends Error {
  constructor (readonly to: string) {
    super('SMS to unreached owner already sent today')
  }
}
