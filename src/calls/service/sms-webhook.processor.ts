import MessagingResponse from 'twilio/lib/twiml/MessagingResponse'
import { taskEither } from 'fp-ts'
import { TaskEither } from 'fp-ts/TaskEither'
import { WorksheetRepository, WorksheetViewProps } from '../../worksheet/repository/worksheet.repository'
import { SmsMessagesRepository, SmsOutgoingMessage } from '../repository/sms-messages.repository'
import { pipe } from 'fp-ts/function'

interface ProcessSmsWebhookCommand {
  fromNumber: string
  message: string
}

export class SmsWebhookProcessor {
  constructor (
    private worksheetRepository: WorksheetRepository,
    private smsMessagesRepository: SmsMessagesRepository,
  ) {
  }

  process (cmd: ProcessSmsWebhookCommand): TaskEither<Error, MessagingResponse> {
    return pipe(
      this.smsMessagesRepository.lastSentTo(cmd.fromNumber),
      taskEither.chain(this.getWorksheet()),
      taskEither.map(this.composeMessage(cmd.fromNumber))
    )
  }

  private composeMessage (fromNumber: string) {
    return (ws: WorksheetViewProps) => {
      const response = new MessagingResponse()
      const lang = fromNumber.startsWith('+351') ? 'PT' : 'ES'
      response.message(
        (lang === 'PT' ?
            'Perfeito! Nos dias seguintes o diretor da %%CITY%% entrará em contato com você para falar sobre o seu imóvel.' :
            'Perfecto! En los siguientes días el director de %%CITY%% lo contactará para hablar de su propiedad.'
        ).replace('%%CITY%%', ws.building.address.city))

      return response
    }
  }

  private getWorksheet () {
    return (lastSms: SmsOutgoingMessage | undefined) => {
      if (!lastSms) {
        return taskEither.left(new Error('No message sent to number'))
      }
      return taskEither.tryCatch(
        () => this.worksheetRepository.getForCallcenterView(lastSms.worksheetId),
        reason => new Error(String(reason))
      )
    }
  }
}
