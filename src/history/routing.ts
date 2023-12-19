import './types'
import { permissions } from '../middleware/jwt'
import { Router } from 'express'
import { listHistoryController } from './controllers'

export function historyRoutes (app, secured) {
  const router = Router()

  router.get('/', permissions.operator, listHistoryController)

  app.use('/history', secured, router)
}
