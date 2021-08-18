import { Twilio } from 'twilio'
import { WorksheetRepository } from '../../worksheet/repository/worksheet.repository'

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
    private worksheetRepository: WorksheetRepository,
    private publicUrl: string,
  ) {
  }

  async sendMessageToUnreachedOwner (cmd: SendMessageToUnreachedOwner) {
    const worksheet = await this.worksheetRepository.getForCallcenterView(cmd.worksheetId)
    const {street, number, city} = worksheet.building.address
    const message = cmd.to.startsWith('+351') ?
      'Olá, eu chamei você para o seu imóvel do %%address%%. Se você está interessado em vender, responda a esta mensagem. Obrigado.' :
      'Hola, le he llamado por su propiedad de la %%address%%. Si le interesa vender conteste a este mensaje. Gracias.'
    await this.twilioClient.messages.create({
      body: message.replace('%%address%%', `${street} ${number} de ${city}`),
      from: '',
      to: cmd.to,
    })
  }
}
