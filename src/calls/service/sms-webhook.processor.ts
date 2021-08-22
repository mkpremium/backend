import MessagingResponse from 'twilio/lib/twiml/MessagingResponse'
import { taskEither } from 'fp-ts'
import { TaskEither } from 'fp-ts/TaskEither'
import { WorksheetRepository, WorksheetViewProps } from '../../worksheet/repository/worksheet.repository'
import { SmsMessagesRepository, SmsOutgoingMessage } from '../repository/sms-messages.repository'
import { pipe } from 'fp-ts/function'
import { EventBus } from '../../infrastructure/event-bus'
import { Logger } from 'winston'

interface ProcessSmsWebhookCommand {
  fromNumber: string
  message: string
}

export class SmsWebhookProcessor {
  constructor (
    private worksheetRepository: WorksheetRepository,
    private smsMessagesRepository: SmsMessagesRepository,
    private eventBus: EventBus,
    private logger: Logger,
  ) {
  }

  process (cmd: ProcessSmsWebhookCommand): TaskEither<Error, MessagingResponse> {
    return pipe(
      this.smsMessagesRepository.lastSentTo(cmd.fromNumber),
      taskEither.chain(this.getWorksheet()),
      taskEither.map(this.composeMessage(cmd.fromNumber)),
      taskEither.map(([ response, ws ]: [ MessagingResponse, WorksheetViewProps ]) => {
        this.eventBus.publish({
          name: 'virtual-caller.sms-received',
          message: cmd.message,
        }).catch(error => this.logger.error(`Couldn't publish message`, { error: error.message }))
        return response
      })
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

      return [ response, ws ]
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
