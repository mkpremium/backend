import './types'
import jwt, { permissions } from '../middleware/jwt'
import { Router } from 'express'
import { listHistoryController } from './controllers'

export function historyRoutes (app) {
  const secured = jwt()
  const router = Router()

  router.get('/', permissions.operator, listHistoryController)

  app.use('/history', secured, router)
}
