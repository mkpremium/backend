import { RequestHandler } from 'express'
import { CreateVirtualCallerService } from '../service/create-virtual-caller.service'

interface Deps {
  createVirtualCallerService: CreateVirtualCallerService
}

export function createCreateVirtualCallerController ({ createVirtualCallerService }: Deps): RequestHandler {
  return async function (req, res) {
    const {
      assignCallsTo,
      name,
      phoneNumber,
      queueId
    } = req.body

    return createVirtualCallerService.createVirtualCaller({
      assignCallsTo,
      name,
      phoneNumber,
      queueId
    }).then((vc) => res.json(vc))
  }
}
