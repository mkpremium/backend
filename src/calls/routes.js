import { Router } from 'express'
import {
  callController,
  hangupController,
  webhookController,
  addNoteController
} from './controllers'
import { permissions } from '../middleware/jwt'

const call = Router()
const webhook = Router()

call.post('/owner/:ownerId', permissions.operator, callController)

call.post('/hangup', permissions.operator, hangupController)

call.post('/note/:callId', permissions.operator, addNoteController)

webhook.post('/', webhookController)

export const callRouter = call
export const webhookCallsRouter = webhook
