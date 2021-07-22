import { expect } from 'chai'
import { stub } from 'sinon'
import { EmailSenderService } from '../../src/email/email-sender.service'
import { userBuilder, userProfileBuilder } from '../user/user.builder'

describe('EmailSenderService', () => {
  let emailSender!: EmailSenderService
  let emailTransportStub
  const testMailerUsername = 'mailer@test.email'

  beforeEach(() => {
    emailTransportStub = {
      sendMail: stub(),
    }
    emailSender = new EmailSenderService(emailTransportStub, testMailerUsername)
  })

  it('sends email', async () => {
    const testEmail = {
      from: userBuilder({
        profile: userProfileBuilder({
          firstName: 'Flipper-Name',
          lastName: 'Flipper-Surname',
          email: 'flipper@test.email',
        }).build()
      }).build(),
      to: 'owner@test.email',
      attachment: {
        content: Buffer.from(''),
        filename: 'propuesta.pdf'
      },
      message: 'test message',
      subject: 'test subject',
    }
    await emailSender.sendMail(testEmail)

    expect(emailTransportStub.sendMail).to.have.been.calledWith({
      to: testEmail.to,
      bcc: 'daniel.leiva@mkpremium.com',
      replyTo: 'Flipper-Name Flipper-Surname<flipper@test.email>',
      from: `Flipper-Name Flipper-Surname<${testMailerUsername}>`,
      subject: testEmail.subject,
      html: testEmail.message,
      text: testEmail.message,
      attachments: [ testEmail.attachment ]
    })
  })
})
