import { Twilio } from 'twilio'
import { WorksheetRepository } from '../../worksheet/repository/worksheet.repository'
import { VirtualCallersRepository } from '../repository/virtual-callers.repository'

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
    private publicUrl: string,
  ) {
  }

  async sendMessageToUnreachedOwner (cmd: SendMessageToUnreachedOwner) {
    const lang = cmd.to.startsWith('+351') ? 'PT' : 'ES'
    const messageWithAddress = await this.composeMessageWithAddress(lang, cmd.worksheetId)
    await this.twilioClient.messages.create({
      body: messageWithAddress.length < MAX_SMS_LENGTH ? messageWithAddress : SmsMessageSender.messageWithoutAddress(lang),
      from: '+351965965374',
      to: cmd.to,
    })
  }

  private async composeMessageWithAddress (lang: string, worksheetId: string) {
    const worksheet = await this.worksheetRepository.getForCallcenterView(worksheetId)
    const { street, number, city } = worksheet.building.address
    const message = lang === 'PT' ?
      'Olá, eu chamei você para o seu imóvel do %%address%%. Se você está interessado em vender, responda a esta mensagem. Obrigado.' :
      'Hola, le he llamado por su propiedad de la %%address%%. Si le interesa vender conteste a este mensaje. Gracias.'

    return message.replace('%%address%%', `${street} ${number} de ${city}`)
  }

  private static messageWithoutAddress (lang: string) {
    return lang === 'PT' ?
      'Olá, eu liguei para você sobre sua propriedade. Se você está interessado em vender, responda a esta mensagem. Obrigado.' :
      'Hola, le he llamado por su propiedad. Si le interesa vender conteste a este mensaje. Gracias.'
  }
}
