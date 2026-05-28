import { Request, Response } from 'express'
import { callEmitter, CallEvent } from '../events/call-events'

export const emitCallCompletedController = () =>
  async (req: Request, res: Response) => {
    callEmitter.emit(CallEvent.CALL_COMPLETED, req.body)
    res.json({
      status: 'emitted',
      event: req.body
    })
  }
