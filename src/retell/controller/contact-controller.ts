import { Request, Response } from 'express'
import { wrap } from 'express-promise-wrap'
import { CallService } from '../service/call-service'
import { CityCallRequest } from '../types/call-batch-request-dto'
import { ContactService } from '../service/contact-service'
import { CallLogResponse } from '../types/call-log-response.dto'
import Retell from 'retell-sdk'
import { ContactDTO } from '../types/contact-dto'
import { initLogger } from '../../infrastructure/logger'

export const getCityContactsController = ({ contactService }: { contactService: ContactService }) =>
  wrap(async (req: Request, res: Response) => {
    const city = req.query.city as string
    const limit = Number(req.query.limit)
    const contacts:ContactDTO[] = await contactService.getCityContacts(city, limit)
    return res.status(200).json({ contacts })
  })

export const scheduleDailyCallsController = ({ callService }: { callService: CallService }) =>
  wrap(async (req: Request, res: Response) => {
    try {
      const body: CityCallRequest[] = req.body
      await callService.saveScheduleDailyCalls(body)
      return res.status(200).json({ status: 'ok', message: 'La planificación se ha guardado correctamente' })
    } catch (err:any) {
      return res.status(400).json({ status: 'error', message: 'No se ha podido guardar la planificación' })
    }
  })

export const getScheduleDailyCallsController = ({ callService }: { callService: CallService }) =>
  wrap(async (req: Request, res: Response) => {
    try {
      const schedule = await callService.getScheduleCalls()
      if (schedule.length === 0) return res.status(200).json({ status: 'ok', message: 'No hay planificación en la base de datos' })
      return res.status(200).json(schedule)
    } catch (err:any) {
      return res.status(400).json({ status: 'error', message: 'No se ha podido obtener la planificación' })
    }
  })

export const getCallLogController = ({ callService }: { callService: CallService }) =>
  wrap(async (req: Request, res: Response) => {
    try {
      const logger = initLogger()
      if (
        !Retell.verify(
          JSON.stringify(req.body),
          process.env.RETELL_API_KEY_WEBHOOK!,
          req.headers['x-retell-signature'] as string
        )
      ) {
        logger.info(req.headers)
        logger.info('Signature header:', req.headers['x-retell-signature'])
        logger.info('Body recibido:', req.body)
        logger.info('Stringify body:', JSON.stringify(req.body))
        logger.info('Webhook key:', process.env.RETELL_API_KEY_WEBHOOK)
        return res.status(401).send('Invalid signature')
      }

      const body: CallLogResponse = req.body
      if (body.event === 'call_analyzed') {
        await callService.saveCallLog(body)
        return res.status(200).json({ status: 'ok', message: 'Call Log registrado en la base de datos' })
      }
      return res.status(200).send({ status: 'ok', message: 'Call Log no es call analyzed' })
    } catch (err:any) {
      res.status(400).json({ status: 'error', message: err?.message || String(err) })
    }
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
      return res.status(200).json({ success: true, message: 'Planificación eliminada correctamente' })
    } catch (err:any) {
      return res.status(500).json({ success: false, message: 'No se ha podido eliminar la planificación' })
    }
  })
