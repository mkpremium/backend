import { Twilio } from 'twilio'

interface SendMessageToUnreachedOwner {
  to: string
  callId: string
  callerId: string
  contactId: string
  ownerId: string
  worksheetId: string
}

export class SmsMessageSender {
  constructor (
    private twilioClient: Twilio,
    private publicUrl: string,
  ) {
  }

  async sendMessageToUnreachedOwner (cmd: SendMessageToUnreachedOwner) {
    const message = cmd.to.startsWith('+351') ?
      'Olá, eu chamei você para o seu imóvel do "endereço" da "cidade". Se você está interessado em vender, responda a esta mensagem. Obrigado.' :
      'Hola, le he llamado por su propiedad de la “direccion“ de “ciudad”. Si le interesa vender conteste a este mensaje. Gracias.'
    await this.twilioClient.messages.create({
      body: message,
      from: '',
      to: cmd.to,
    })
  }
}
