import { Request, Response } from 'express'
import { CallService } from '../service/call.service'
import Retell from 'retell-sdk/index.mjs'

export const getNewOwnerContactController = ({ callService }:{callService:CallService}) =>
  async (req:Request, res:Response) => {
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
      await callService.takeNewOwnerContact(body)
      console.log('Nuevo contacto modificado correctamente')
    } catch (err:any) {
      res.status(400).json({ status: 'error', message: err.message })
    }
  }
