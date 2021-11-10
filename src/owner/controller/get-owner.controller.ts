import { RequestHandler } from '../../infrastructure/request-handler'

interface Deps {
}

export function getOwnerController (deps: Deps): RequestHandler {
  return async function (req, res): Promise<void> {
    res.sendStatus(501)
    return Promise.resolve()
  }
}

