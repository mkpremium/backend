export class ClientError extends Error {
  constructor (message, statusCode = 400) {
    super(message)
    this.statusCode = statusCode
  }
}

export function notImplemented (req, res) {
  return res.status(501)
}
