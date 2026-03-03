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
      // Verificación de firma
      if (
        !Retell.verify(
          JSON.stringify(req.body),
          process.env.RETELL_API_KEY_WEBHOOK!,
          req.headers['x-retell-signature'] as string
        )
      ) {
        return res.status(401).send('Invalid signature')
      }

      const body: CallLogResponse = req.body

      if (body.event === 'call_analyzed') {
        try {
          await callService.saveCallLog(body)
          console.info('Call log registrado en la bbdd')
          return res.status(200).json({ status: 'ok', message: 'Call Log registrado en la base de datos' })
        } catch (err: any) {
          console.warn('Call log save warning:', err?.message || err)
          return res.status(200).json({
            status: 'warning',
            message: 'Call log recibido pero hubo problemas: ' + (err?.message || String(err))
          })
        }
      }
      console.info('Call log no es call analyzed')
      return res.status(200).send({ status: 'ok', message: 'Call Log no es call analyzed' })
    } catch (err: any) {
      console.error({ status: 'error', message: err?.message || String(err) })
      return res.status(400).json({ status: 'error', message: err?.message || String(err) })
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

export const getCallBackController = ({ callService }: { callService: CallService }) =>
  wrap(async (req: Request, res: Response) => {
    try {
      // Verificación de firma
      if (
        !Retell.verify(
          JSON.stringify(req.body),
          process.env.RETELL_API_KEY_WEBHOOK!,
          req.headers['x-retell-signature'] as string
        )
      ) {
        return res.status(401).send('Invalid signature')
      }
      const params = req.params
      const body = req.body
      await callService.configScheduledCall(body, params)
      return res.status(200).json({ success: true, message: 'Llamada planificada correctamente' })
    } catch (err:any) {
      return res.status(500).json({ success: false, message: 'Error al planificar la llamada' })
    }
  })
