import { CallScheduleService } from '../service/call-schedule.service'
import { Request, Response } from 'express'

export const sendCallsController = ({ callScheduleService }:{callScheduleService:CallScheduleService}) =>
  async (req: Request, res: Response) => {
    try {
      if (process.env.ALLOW_MANUAL_SEND_CALLS !== 'true') {
        return res.status(400).json({ status: 'error', message: 'Manual call trigger disabled' })
      }
      const result = await callScheduleService.readCallSchedule()
      res.status(200).json(result)
    } catch (err:any) {
      console.error('Error SendCallsController:', err.message)
      res.status(400).json({ status: 'error', message: err.message })
    }
  }
