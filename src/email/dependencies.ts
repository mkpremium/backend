import { asClass, AwilixContainer } from 'awilix'
import { EmailSenderService } from './email-sender.service'

export const setupEmailDependencies = (container: AwilixContainer) => {
  container.register({
    emailSender: asClass(EmailSenderService).classic().singleton(),
  })
}
