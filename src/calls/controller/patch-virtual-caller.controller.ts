import { RequestHandler } from 'express'

interface Deps {
}

export function createPatchVirtualCallerController({}: Deps): RequestHandler {
  return function (req, res) {
    return Promise.reject(new Error('Not implemented'))
  }
}
