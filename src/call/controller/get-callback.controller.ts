import Retell from 'retell-sdk/index.mjs'
import { CallService } from '../service/call.service'
import { Request, Response } from 'express'

export const getCallbackController = ({ callService }: { callService: CallService }) =>
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
        return res.status(401).send('Invalid signature')
      }
      res.status(200).json({ status: 'ok' })

      const body = req.body

      await callService.configScheduledCall(body)
      console.log('Llamada planificada correctamente')
    } catch (err:any) {
      console.error('schedule-callback error:', err)
    }
  }
