import MessagingResponse from 'twilio/lib/twiml/MessagingResponse'
import { taskEither } from 'fp-ts'
import { TaskEither } from 'fp-ts/TaskEither'
import { WorksheetRepository, WorksheetViewProps } from '../../worksheet/repository/worksheet.repository'
import { SmsMessagesRepository, SmsOutgoingMessage } from '../repository/sms-messages.repository'
import { pipe } from 'fp-ts/function'
import { EventBus } from '../../infrastructure/event-bus'
import { Logger } from 'winston'

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
      taskEither.map(([ lastSms, ws, response ]: [ SmsOutgoingMessage, WorksheetViewProps, MessagingResponse ]) => {
        this.eventBus.publish({
          name: 'virtual-caller.sms-received',
          callerId: lastSms.callerId,
          message: cmd.message,
          buildingId: ws.building.id,
          worksheetId: ws.id,
          ownerId: lastSms.ownerId,
          contactId: lastSms.contactId,
        } as SmsReceived).catch(error => this.logger.error(`Couldn't publish message`, { error: error.message }))
        return response
      })
    )
  }

  private composeMessage (fromNumber: string) {
    return ([ lastSms, ws ]: [ SmsOutgoingMessage, WorksheetViewProps ]) => {
      const response = new MessagingResponse()
      const lang = fromNumber.startsWith('+351') ? 'PT' : 'ES'
      response.message(
        (lang === 'PT' ?
            'Perfeito! Nos dias seguintes o diretor da %%CITY%% entrará em contato com você para falar sobre o seu imóvel.' :
            'Perfecto! En los siguientes días el director de %%CITY%% lo contactará para hablar de su propiedad.'
        ).replace('%%CITY%%', ws.building.address.city))

      return [ lastSms, ws, response ]
    }
  }

  private getWorksheet () {
    return (lastSms: SmsOutgoingMessage | undefined) => {
      if (!lastSms) {
        return taskEither.left(new Error('No message sent to number'))
      }
      return taskEither.tryCatch(
        () => this.worksheetRepository.getForCallcenterView(lastSms.worksheetId).then(ws => [ lastSms, ws ]),
        reason => new Error(String(reason))
      )
    }
  }
}

interface ProcessSmsWebhookCommand {
  fromNumber: string
  message: string
}

export interface SmsReceived {
  name: 'virtual-caller.sms-received'
  callerId: string
  message: string
  buildingId: string
  worksheetId: string
  ownerId: string
  contactId: string
}
