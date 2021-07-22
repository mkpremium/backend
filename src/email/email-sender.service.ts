import Mail, { Attachment } from 'nodemailer/lib/mailer'
import { UserProps } from '../types/user'

export class EmailSenderService {
  constructor (
    private emailTransport: Mail,
    private mailerUsername: string
  ) {
  }

  sendMail (email: {
    to: string,
    subject: string,
    from: UserProps,
    message: string,
    attachment: Attachment
  }): Promise<void> {
    const senderFullName = `${email.from.profile.firstName} ${email.from.profile.lastName}`
    return this.emailTransport.sendMail({
      to: email.to,
      bcc: 'daniel.leiva@mkpremium.com',
      replyTo: `${senderFullName}<${email.from.profile.email}>`,
      from: `${senderFullName}<${this.mailerUsername}>`,
      subject: email.subject,
      html: email.message,
      text: email.message,
      attachments: [ email.attachment ]
    })
  }
}
