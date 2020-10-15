import { Router } from 'express'
import { suggestionController } from './controllers'

const router = Router()

router.get('/:field', suggestionController)

export default router
