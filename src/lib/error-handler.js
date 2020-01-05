import { errorVerbosity } from '../../config'

const level = {
  NONE: 0,
  MESSAGE: 1,
  STACK: 2
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

  switch (errorVerbosity) {
    case level.MESSAGE:
      console.error(err.message)
      break
    case level.STACK:
      console.error(err)
      break
  }
}

/**
 * @swagger
 * definitions:
 *   Error:
 *     properties:
 *       message:
 *         type: string
 */
export function appErrorHandler (err, req, res, next) {
  if (res.headersSent) {
    return next(err)
  }

  prepareErrorCode(err)

  res.status(err.code)
  res.json({ message: err.message })
}

export function oldAppErrorHandler (err, req, res, next) {
  if (res.headersSent) {
    return next(err)
  }

  prepareErrorCode(err)

  res.status(err.code)
  res.json({
    Error: true,
    Message: err.message
  })
}

export default appErrorHandler
