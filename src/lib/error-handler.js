import { logger } from '../infrastructure/logger'

export function appErrorHandler (error, req, res, next) {
  if (res.headersSent) {
    return next(error)
  }

  prepareErrorCode(error)
  if (error.code >= 500) {
    logger.error('appErrorHandler', { error: { ...error, stack: error.stack } })
  } else {
    logger.warning('appErrorHandler', { error })
  }

  res.status(error.code)
  res.json({ message: error.message })
}

function prepareErrorCode (err) {
  if (/^\[tcomb/.test(err.message)) {
    err.code = err.code || 400
    err.message = err.message.replace('[tcomb] ', '')
  }

  // some errors code is an string (jwt)
  err.code = err.status || err.code

  // error from couchbase are outside HTTP range
  if (!err.code || err.code < 400 || err.code > 599) {
    err.code = 500
  }

  // for any reason not listed before
  err.code = err.code || 500
  if (isNaN(err.code)) {
    logger.error('prepareErrorCode error.code not a number', { error: err })
    err.code = 500
  }
}

export default appErrorHandler
