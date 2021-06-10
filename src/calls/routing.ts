import { Express, Router } from 'express'
import { AwilixContainer } from 'awilix'

export const callsRoutes = (container: AwilixContainer, app: Express) => {
  const router = Router()

  router.post('/token', container.resolve('callTokenGeneratorController'))

  router.post('/twilio/voice', container.resolve('outgoingCallWebhookController'))

  app.use('/calls', router)
}
