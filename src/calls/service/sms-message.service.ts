import { Twilio } from 'twilio'
import { WorksheetRepository, WorksheetViewProps } from '../../worksheet/repository/worksheet.repository'
import { SmsMessagesRepository } from '../repository/sms-messages.repository'
import { chain, map, TaskEither } from 'fp-ts/TaskEither'
import { type, TypeOf } from 'io-ts'
import { taskEither } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import uuid from 'uuid/v4'
import { NonEmptyString } from 'io-ts-types'
import moment from 'moment'

export const SendMessageToUnreachedOwnerCodec = type({
  to: NonEmptyString,
  callerId: NonEmptyString,
  contactId: NonEmptyString,
  ownerId: NonEmptyString,
  worksheetId: NonEmptyString,
})
export type SendMessageToUnreachedOwner = TypeOf<typeof SendMessageToUnreachedOwnerCodec>
const MAX_SMS_LENGTH = 160

interface BuildingOwnerPhone {
  lastSmsSentAt: Date,
}

interface BuildingOwnerPhonesRepository {
  getByPhoneNumberAndLock (to: string): TaskEither<Error, { ownerPhone: BuildingOwnerPhone, cas: any }>
}

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
    return pipe(
      this.assertNoSmsSentTodayToPhoneNumber(cmd.to),
      chain(() => this.composeMessageWithAddress(lang, cmd.worksheetId)),
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
      chain(() => this.smsMessagesRepository.addOutgoing({
        id: uuid(),
        createdAt: new Date(),
        ...cmd,
      }))
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

  private assertNoSmsSentTodayToPhoneNumber (to: string): TaskEither<Error, void> {
    return pipe(
      this.buildingOwnerPhonesRepository.getByPhoneNumberAndLock(to),
      chain(({ ownerPhone }) => {
        const today = moment()
        if (ownerPhone && moment(ownerPhone.lastSmsSentAt).isSame(today, 'day')) {
          return taskEither.left(new SmsAlreadySentToday(to))
        }
        return taskEither.of(constVoid())
      })
    )
  }
}

class SmsAlreadySentToday extends Error {
  constructor (readonly to: string) {
    super('SMS to unreached owner already sent today')
  }
}
