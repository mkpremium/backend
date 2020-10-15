import { Router } from 'express'
import { listHistoryController } from './controllers'
import { permissions } from '../middleware/jwt'

const router = Router()

router.get('/', permissions.operator, listHistoryController)

export default router
