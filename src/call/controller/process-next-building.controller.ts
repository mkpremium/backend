import { Request, Response } from 'express'
import { CallService } from '../service/call.service'

export const processNextBuildingController = ({ callService }:{callService:CallService}) =>
  async (req: Request, res: Response) => {
    try {
      const result = await callService.processNextBuilding(req.params.city)
      res.status(200).json(result)
    } catch (err:any) {
      console.error('Error Processing Next Building:', err.message)
      res.status(400).json({ status: 'error', message: err.message })
    }
  }
