import { Router } from 'express'
import { createEmailController } from './controllers'

const router = Router()

router.post('/', createEmailController)

export default router
