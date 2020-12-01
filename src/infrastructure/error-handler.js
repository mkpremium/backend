import { logger } from './logger'
import { EntityNotFound } from '../db/errors'
import { HttpError } from '../lib/http-error'

export function appErrorHandler (error, req, res, next) {
  if (res.headersSent) {
    return next(error)
  }

  if (error instanceof EntityNotFound) {
    res.status(404).send()
    return
  }

  const statusCode = inferStatusCode(error)

  logError(statusCode, error)

  res.status(statusCode)
  res.json({ message: error.message })
}

export function inferStatusCode (error) {
  switch (true) {
    case error.message.substring(0, 7) === '[tcomb]':
      return 400
    case error instanceof HttpError:
      return error.statusCode
    case !!error.status:
      return error.status
    default:
      return 500
  }
}

function logError (statusCode, error) {
  if (statusCode >= 500) {
    logger.error('server error', { error: { ...error, stack: error.stack, message: error.message } })
  }
}

export default appErrorHandler
