import { Twilio } from 'twilio'
import { WorksheetRepository, WorksheetViewProps } from '../../worksheet/repository/worksheet.repository'
import { SmsMessagesRepository } from '../repository/sms-messages.repository'
import { chain, map, TaskEither } from 'fp-ts/TaskEither'
import { Errors } from 'io-ts'
import { taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'

interface SendMessageToUnreachedOwner {
  to: string
  callId: string
  callerId: string
  contactId: string
  ownerId: string
  worksheetId: string
}

const MAX_SMS_LENGTH = 160

export class SmsMessageSender {
  constructor (
    private twilioClient: Twilio,
    private worksheetRepository: WorksheetRepository,
    private smsMessagesRepository: SmsMessagesRepository,
  ) {
  }

  sendMessageToUnreachedOwner (cmd: SendMessageToUnreachedOwner): TaskEither<Errors | Error, void> {
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
      )
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
