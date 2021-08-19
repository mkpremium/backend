import { Task } from 'fp-ts/Task'
import MessagingResponse from 'twilio/lib/twiml/MessagingResponse'
import { task } from 'fp-ts'

interface ProcessSmsWebhookCommand {
  fromNumber: string
  message: string
}

export class SmsWebhookProcessor {
  process (cmd: ProcessSmsWebhookCommand): Task<MessagingResponse> {
    const lang = cmd.fromNumber.startsWith('+351') ? 'PT' : 'ES'
    const response = new MessagingResponse()
    response.message(
      lang === 'PT' ?
        'Perfeito! Nos dias seguintes o diretor da "cidade" entrará em contato com você para falar sobre o seu imóvel.' :
        'Perfecto! En los siguientes días el director de "ciudad" lo contactará para hablar de su propiedad.'
    )

    return task.of(response)
  }
}
