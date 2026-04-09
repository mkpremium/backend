import Retell from 'retell-sdk/index.mjs'
import { CallLogService } from '../service/call-log.service'
import { CallLogResponse } from '../types/call-log-response.dto'
import { Request, Response } from 'express'

export const getCallLogController = ({ callLogService }: { callLogService: CallLogService }) =>
  async (req: Request, res: Response) => {
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
          await callLogService.saveCallLog(body)
        } catch (err: any) {
          console.warn('Call log save warning:', err?.message || err)
        }
      }
    } catch (err: any) {
      console.error({ status: 'error', message: err?.message || String(err) })
    }
  }
