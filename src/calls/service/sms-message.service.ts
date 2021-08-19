import { Twilio } from 'twilio'
import { WorksheetRepository, WorksheetViewProps } from '../../worksheet/repository/worksheet.repository'
import { SmsMessagesRepository } from '../repository/sms-messages.repository'
import { chain, map, TaskEither } from 'fp-ts/TaskEither'
import { Errors, type, TypeOf } from 'io-ts'
import { taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import uuid from 'uuid/v4'
import { NonEmptyString } from 'io-ts-types'
import { isRight } from 'fp-ts/Either'

const SendMessageToUnreachedOwnerCodec = type({
  to: NonEmptyString,
  callerId: NonEmptyString,
  contactId: NonEmptyString,
  ownerId: NonEmptyString,
  worksheetId: NonEmptyString,
})
type SendMessageToUnreachedOwner = TypeOf<typeof SendMessageToUnreachedOwnerCodec>
const MAX_SMS_LENGTH = 160

export class SmsMessageSender {
  constructor (
    private twilioClient: Twilio,
    private worksheetRepository: WorksheetRepository,
    private smsMessagesRepository: SmsMessagesRepository,
  ) {
  }

  sendMessageToUnreachedOwner (input: unknown): TaskEither<Errors | Error, void> {
    const decodedInput = SendMessageToUnreachedOwnerCodec.decode(input)
    if (!isRight(decodedInput)) {
      return taskEither.left(decodedInput.left)
    }

    const cmd = decodedInput.right
    const lang = cmd.to.startsWith('+351') ? 'PT' : 'ES'
    return pipe(
      this.composeMessageWithAddress(lang, cmd.worksheetId),
      map(messageWithAddress =>
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
          'Olá, eu chamei você para o seu imóvel do %%address%%. Se você está interessado em vender, responda a esta mensagem. Obrigado.' :
          'Hola, le he llamado por su propiedad de la %%address%%. Si le interesa vender conteste a este mensaje. Gracias.'

        return message.replace('%%address%%', `${street} ${number} de ${city}`)
      }))
  }

  private static messageWithoutAddress (lang: string) {
    return lang === 'PT' ?
      'Olá, eu liguei para você sobre sua propriedade. Se você está interessado em vender, responda a esta mensagem. Obrigado.' :
      'Hola, le he llamado por su propiedad. Si le interesa vender conteste a este mensaje. Gracias.'
  }
}
