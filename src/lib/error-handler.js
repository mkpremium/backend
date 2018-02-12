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

  // some errors code is an string (jwt)
  err.code = err.status || err.code;

  // error from couchbase are outside HTTP range
  if (!err.code || err.code < 400 || err.code > 599) {
    err.code = 500;
  }

  if (err.code === 500) {
    console.error(err);
  } else {
    console.error(err.message);
  }

  res.status(err.code || 500);
  res.json({message: err.message});
}

export default appErrorHandler;
