import { Request, Response } from 'express'
import { CallScheduleService } from '../service/call-schedule.service'
import { CityCallRequest } from '../types/call-batch-request-dto'

export const saveScheduleCallsController = ({ callScheduleService }:{callScheduleService:CallScheduleService}) =>
  async (req:Request, res:Response) => {
    try {
      const body: CityCallRequest[] = req.body
      await callScheduleService.saveCallSchedule(body)
      return res.status(200).json({ status: 'ok', message: 'La planificación se ha guardado correctamente' })
    } catch (err:any) {
      return res.status(400).json({ status: 'error', message: 'No se ha podido guardar la planificación' })
    }
  }

export const getScheduleCallsController = ({ callScheduleService }: { callScheduleService: CallScheduleService }) =>
  async (req: Request, res: Response) => {
    try {
      const schedule = await callScheduleService.getCallSchedule()
      if (schedule.length === 0) return res.status(200).json({ status: 'ok', message: 'No hay planificación en la base de datos' })
      return res.status(200).json(schedule)
    } catch (err:any) {
      return res.status(400).json({ status: 'error', message: 'No se ha podido obtener la planificación' })
    }
  }

export const deleteScheduleCallsController = ({ callScheduleService }: { callScheduleService: CallScheduleService }) =>
  async (req: Request, res: Response) => {
    try {
      await callScheduleService.deleteCallSchedule()
      return res.status(200).json({ success: true, message: 'Planificación eliminada correctamente' })
    } catch (err:any) {
      return res.status(500).json({ success: false, message: 'No se ha podido eliminar la planificación' })
    }
  }
