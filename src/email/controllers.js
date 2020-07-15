import { logger } from '../infrastructure/logger'
import multer from 'multer'
import { wrap } from 'express-promise-wrap'
import { compose } from 'compose-middleware'
import { mailer, storage } from '../../config'
import t from './types'
import { newHttpError } from '../lib/http-error'

const attachment = multer({ storage }).single('attachment')

async function sendMessage (message) {
  const info = await mailer.transporter.sendMail(message)
  logger.debug('emails-controller#sendMessage email sent sucessfully', { info, mailerInfo: mailer.info(info) })
}

function createMessage (from, data, attachment) {
  const { to, subject, text, html, cc, cco } = t.EmailBody(data)

  if (!from.email) {
    throw newHttpError(409, 'No tiene email configurado comuníquese con su administrador')
  }

  const attachments = []
  if (attachment) {
    attachments.push({
      filename: attachment.originalname,
      path: attachment.path,
      contentType: attachment.mimetype
    })
  }

  const message = {
    to,
    cc,
    bcc: cco,
    replyTo: `${from.firstName} ${from.lastName}<${from.email}>`,
    from: `${from.firstName} ${from.lastName}<${process.env.MAILER_USER}>`,
    subject,
    html,
    text,
    attachments
  }

  logger.debug('emails-controller#createMessase', { message })
  return message
}

async function createEmail (req, res) {
  const message = createMessage(req.user.operator.profile, req.body || {}, req.file)
  await sendMessage(message)
  res.status(201).send()
}

export const createEmailController = compose(attachment, [ wrap(createEmail) ])
