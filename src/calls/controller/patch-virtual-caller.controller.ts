import { RequestHandler } from 'express'
import {
  PatchVirtualCallerCommand,
  PatchVirtualCallerProps,
  PatchVirtualCallerService
} from '../service/patch-virtual-caller.service'

interface Deps {
  patchVirtualCallerService: PatchVirtualCallerService
}

export function createPatchVirtualCallerController ({ patchVirtualCallerService }: Deps): RequestHandler {
  return async function (req, res) {
    const updatedCaller = await patchVirtualCallerService.patch({
      virtualCallerId: req.params.callerId,
      ...req.body
    })
    res.json(updatedCaller)
  }
}
