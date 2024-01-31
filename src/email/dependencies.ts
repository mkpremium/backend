import { asClass, asFunction, AwilixContainer } from 'awilix'
import { EmailSenderService } from './email-sender.service'
import nodemailer from 'nodemailer'

export const setupEmailDependencies = (container: AwilixContainer) => {
  container.register({
    emailTransport: asFunction(() => {
      return nodemailer.createTransport({
        host: process.env.MAILER_HOST,
        port: Number(process.env.MAILER_PORT || '587'),
        secure: process.env.MAILER_SECURE === 'true',
        connectionTimeout: 2000,
        auth: {
          user: process.env.MAILER_USER,
          pass: process.env.MAILER_PASS
        }
      })
    }).singleton(),
    emailSender: asClass(EmailSenderService).inject(() => ({
      mailerUsername: process.env.MAILER_USER
    })).classic().singleton()
  })
}
