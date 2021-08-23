import { SmsWebhookProcessor } from '../service/sms-webhook.processor'
import { isRight } from 'fp-ts/Either'
import { Logger } from 'winston'

interface Deps {
  smsWebhookProcessor: SmsWebhookProcessor
  logger: Logger
}

export function twilioSMSWebhookController ({ smsWebhookProcessor, logger }: Deps) {
  return async function (req, res) {
    const { Body, From, SmsMessageSid } = req.body
    const cmd = {
      fromNumber: From,
      message: Body,
    }
    const response = await smsWebhookProcessor.process(cmd)()

    if (isRight(response)) {
      res.send(response.right.toString())
    } else {
      logger.error('SMS process failed', { error: response.left.message, From, Body, SmsMessageSid })
      res.sendStatus(500)
    }
  }
}
