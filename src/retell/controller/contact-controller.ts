import { Request, Response } from 'express'
import { wrap } from 'express-promise-wrap'
import { CallService } from '../service/call-service'
import { CityCallRequest } from '../types/call-batch-request-dto'
import { ContactService } from '../service/contact-service'
import { CallLogResponse } from '../types/call-log-response.dto'
import Retell from 'retell-sdk'
import { ContactDTO } from '../types/contact-dto'

export const getCityContactsController = ({ contactService }: { contactService: ContactService }) =>
  wrap(async (req: Request, res: Response) => {
    const city = req.query.city as string
    const limit = Number(req.query.limit)
    const contacts:ContactDTO[] = await contactService.getCityContacts(city, limit)
    res.status(200).json({ contacts })
  })

export const scheduleDailyCallsController = ({ callService }: { callService: CallService }) =>
  wrap(async (req: Request, res: Response) => {
    try {
      const body: CityCallRequest[] = req.body
      await callService.saveScheduleDailyCalls(body)
      res.status(200).json({ status: 'ok', message: 'La planificación se ha guardado correctamente' })
    } catch (err:any) {
      res.status(400).json({ status: 'error', message: 'No se ha podido guardar la planificación' })
    }
  })

export const getScheduleDailyCallsController = ({ callService }: { callService: CallService }) =>
  wrap(async (req: Request, res: Response) => {
    try {
      const schedule = await callService.getScheduleCalls()
      res.status(200).json(schedule)
    } catch (err:any) {
      res.status(400).json({ status: 'error', message: 'No se ha podido obtener la planificación' })
    }
  })

export const getCallLogController = ({ callService }: { callService: CallService }) =>
  wrap(async (req: Request, res: Response) => {
    if (
      !Retell.verify(
        JSON.stringify(req.body),
        process.env.RETELL_API_KEY!,
        req.headers['x-retell-signature'] as string
      )
    ) {
      res.status(401).send('Invalid signature')
    }

    const body: CallLogResponse = req.body
    if (body.event === 'call_analyzed') {
      const databaseResponse = await callService.saveCallLog(body)
      res.status(200).json(databaseResponse)
    }
    res.status(204).send()
  })

export const sendCallsController = ({ callService }: { callService: CallService }) =>
  wrap(async (req: Request, res: Response) => {
    try {
      const result = await callService.readScheduleCalls()
      res.status(200).json(result)
    } catch (err:any) {
      res.status(400).json({ status: 'error', message: err.message })
    }
  })

export const deleteScheduleDailyCallsController = ({ callService }: { callService: CallService }) =>
  wrap(async (req: Request, res: Response) => {
    try {
      await callService.deleteCallSchedule()
      res.status(200).json({ success: true, message: 'Planificación eliminada correctamente' })
    } catch (err:any) {
      res.status(500).json({ success: false, message: 'No se ha podido eliminar la planificación' })
    }
  })
