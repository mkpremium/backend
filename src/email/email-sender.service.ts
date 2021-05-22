export class EmailSenderService {
  sendMail (email: {
    to: string,
    subject: string,
    from: any,
    message: string,
    attachment: Buffer[]
  }): Promise<void> {
    return Promise.reject(new Error('not implemented'))
  }
}
