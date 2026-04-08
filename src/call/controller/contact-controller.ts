import { Request, Response } from 'express'
import { wrap } from 'express-promise-wrap'
import { CallService } from '../service/call-service'
import { CityCallRequest } from '../types/call-batch-request-dto'
import { ContactService } from '../service/contact-service'
import { CallLogResponse, UmindCallLog } from '../types/call-log-response.dto'
import Retell from 'retell-sdk'
import { ContactDTO } from '../types/contact-dto'
import axios from 'axios'

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
        console.error('Firma de Retell incorrecta')
        return res.status(401).send('Invalid signature')
      }

      res.status(200).json({ status: 'ok' })

      const body: CallLogResponse = req.body

      if (body.event === 'call_analyzed') {
        try {
          const callLog:UmindCallLog = await callService.saveCallLog(body)
          console.info('Call log registrado en la bbdd')
          try {
            await axios.post(process.env.UMINDS_URL!, callLog, { headers: { 'Content-Type': 'application/json' } })
            console.info('Call log enviado a Umind correctamente')
          } catch (err:any) {
            console.warn('Error enviando Call Log a Umind:', err?.message || err)
          }
        } catch (err: any) {
          console.warn('Call log save warning:', err?.message || err)
        }
      }
    } catch (err: any) {
      console.error({ status: 'error', message: err?.message || String(err) })
    }
  })

export const sendCallsController = ({ callService }: { callService: CallService }) =>
  wrap(async (req: Request, res: Response) => {
    try {
      if (process.env.ALLOW_MANUAL_SEND_CALLS === 'false') {
        return res.status(400).json({ status: 'error', message: 'Manual call trigger disabled' })
      }
      const result = await callService.readScheduleCalls()
      res.status(200).json(result)
    } catch (err:any) {
      console.error('Error SendCallsController:', err.message)
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

export const getCallbackController = ({ callService }: { callService: CallService }) =>
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
      res.status(200).json({ status: 'ok' })

      const body = req.body

      await callService.configScheduledCall(body)
      console.log('Llamada planificada correctamente')
    } catch (err:any) {
      console.error('schedule-callback error:', err)
    }
  })

export const getLastCalledDate = ({ callService }: { callService: CallService}) =>
  wrap(async (req: Request, res: Response) => {
    try {
      const buildingId = req.query.buildingId as string
      console.log(`${buildingId}`)
      if (!buildingId) return res.status(400).json({ success: false, message: 'El Id del edificio es obligatorio' })
      await callService.changeNegotiationStatus(buildingId)

      return res.status(200).json({ success: 'ok' })
    } catch (err: any) {
      return res.status(500).json({ success: false, message: 'No se ha podido obtener la última fecha de llamada' })
    }
  })
