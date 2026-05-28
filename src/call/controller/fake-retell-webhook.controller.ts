import { Request, Response } from 'express'
import { CallLogService } from '../service/call-log.service'

export const fakeRetellWebhookController = ({ callLogService }:{callLogService:CallLogService}) =>
  async (req: Request, res: Response) => {
    const result = await callLogService.saveCallLog(req.body)
    res.json({
      status: 'ok',
      message: 'Fake Retell webhook processed',
      result
    })
  }
