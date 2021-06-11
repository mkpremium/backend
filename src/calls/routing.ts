import { Express, Router } from 'express'
import { AwilixContainer } from 'awilix'
import { wrap } from 'express-promise-wrap'

export const callsRoutes = (container: AwilixContainer, app: Express) => {
  const router = Router()

  router.post('/token', wrap(container.resolve('callTokenGeneratorController')))

  router.post('/twilio/voice', wrap(container.resolve('outgoingCallWebhookController')))
  router.post('/twilio/:callId/gather', wrap(container.resolve('gatheredInputController')))
  router.post('/twilio/:callId/done', wrap(container.resolve('callDoneController')))

  app.use('/calls', router)
}
