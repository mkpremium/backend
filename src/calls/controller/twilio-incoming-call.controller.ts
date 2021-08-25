import { RequestHandler } from 'express'

export function twilioIncomingCallController(): RequestHandler {
  return async function(req, res) {
    res.sendStatus(501)
  }
}
