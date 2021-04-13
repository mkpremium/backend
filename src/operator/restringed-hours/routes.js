import { Router } from 'express'
import {
  getOperatorRestringedHoursController,
  writeAnotherOperatorRestringedHoursController,
  writeOperatorRestringedHoursController
} from './controllers'

const router = Router({})

router.get('/', getOperatorRestringedHoursController)

router.put('/', writeOperatorRestringedHoursController)

router.put('/:id', writeAnotherOperatorRestringedHoursController)

export default router
