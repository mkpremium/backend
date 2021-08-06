interface SendMessageToUnreachedOwner {
  to: string
  callId: string
  callerId: string
  contactId: string
  ownerId: string
  worksheetId: string
}

export class SmsMessageSender {
  async sendMessageToUnreachedOwner (cmd: SendMessageToUnreachedOwner) {
  }
}
