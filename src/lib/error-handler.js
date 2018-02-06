/**
 * @swagger
 * definitions:
 *   Error:
 *     properties:
 *       message:
 *         type: string
 */

function appErrorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  // tcomb error handler
  if (/^\[tcomb\]/.test(err.message)) {
    err.code = err.code || 400;
    err.message = err.message.replace('[tcomb] ', '');
  }

  const throwErrorOnConsole = process.env.NODE_ENV !== 'test' || err.code === 500;

  // error from couchbase are outside HTTP range
  if (err.code < 400 || err.code > 599) {
    err.code = 500;
  }

  if (throwErrorOnConsole) {
    console.error(err);
  }

  res.status(err.code || 500);
  res.json({message: err.message});
}

export default appErrorHandler;
