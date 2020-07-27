import { Router } from 'express'
import { addNoteController, listNotesController } from './controllers'

const router = Router()

router.get('/', listNotesController)

router.post('/', addNoteController)

export default router
