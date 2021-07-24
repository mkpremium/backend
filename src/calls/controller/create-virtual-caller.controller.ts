import { RequestHandler } from 'express'
import { CreateVirtualCallerService } from '../service/create-virtual-caller.service'

interface Deps {
  createVirtualCallerService: CreateVirtualCallerService
}

export function createCreateVirtualCallerController({}: Deps): RequestHandler {
  return async function(req, res) {
    res.sendStatus(501)
    return Promise.reject('Not implemented')
  }
}
