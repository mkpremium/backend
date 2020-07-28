import { Router } from 'express'
import { downloadMetadataFileController } from './controllers'

const router = Router()

router.get('/:id/download', downloadMetadataFileController)

export default router
