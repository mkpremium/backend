import { Router } from 'express'
import { setProfitGoalToOperatorController } from './controllers'

const router = Router()

router.post('/goal', setProfitGoalToOperatorController)

export default router
