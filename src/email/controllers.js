import debug from 'debug';
import multer from 'multer';
import uuid from 'uuid/v4';
import {wrap} from 'express-promise-wrap';
import {compose} from 'compose-middleware';
import {mailer, storage} from '../../config';
import t from './types';
import {newHttpError} from '../lib/http-error';

const debugEmail = debug('app:email:controller');
const attachment = multer({storage}).single('attachment');

async function sendMessage(message) {
  const info = await mailer.transporter.sendMail(message);
  debugEmail('sendMessage', 'success', info, mailer.info(info));
}

function createMessage(from, to, subject, body, attachment, cc, cco) {
  if (!from) {
    throw newHttpError(409, 'No tiene email configurado comuníquese con su administrador');
  }

  const attachments = [];
  if (attachment) {
    attachments.push({
      filename: `${attachment.filename}-${attachment.originalname}`,
      path: attachment.path,
      contentType: attachment.mimetype,
      cid: uuid()
    });
  }

  const message = {
    to,
    cc,
    bcc: cco,
    from,
    subject,
    text: body,
    html: body,
    attachments
  };

  debugEmail('createMessase', message);
  return message;
}

async function createEmail(req, res) {
  const {to, subject, body, cc, cco} = t.EmailBody(req.body);
  const from = req.user.operator.profile.email;
  const message = createMessage(from, to, subject, body, req.file, cc, cco);
  await sendMessage(message);
  res.status(201).send();
}

export const createEmailController = compose(attachment, [wrap(createEmail)]);
