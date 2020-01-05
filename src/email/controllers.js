import debug from 'debug'
import multer from 'multer'
import { wrap } from 'express-promise-wrap'
import { compose } from 'compose-middleware'
import { mailer, storage } from '../../config'
import t from './types'
import { newHttpError } from '../lib/http-error'

const debugEmail = debug('app:email:controller')
const attachment = multer({ storage }).single('attachment')

async function sendMessage (message) {
  const info = await mailer.transporter.sendMail(message)
  debugEmail('sendMessage', 'success', info, mailer.info(info))
}

function createMessage (from, data, attachment) {
  const { to, subject, text, html, cc, cco } = t.EmailBody(data)

  if (!from) {
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
    from,
    subject,
    html,
    text,
    attachments
  }

  debugEmail('createMessase', message)
  return message
}

async function createEmail (req, res) {
  const from = req.user.operator.profile.email
  const message = createMessage(from, req.body || {}, req.file)
  await sendMessage(message)
  res.status(201).send()
}

export const createEmailController = compose(attachment, [wrap(createEmail)])
