export function newHttpError (code, message) {
  return new HttpError(code, message)
}

export class HttpError extends Error {
  constructor (statusCode, message) {
    super(message)
    this.statusCode = statusCode
  }
}
