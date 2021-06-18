import { Express, Router } from 'express'
import { AwilixContainer } from 'awilix'
import { wrap } from 'express-promise-wrap'

export const callsRoutes = (container: AwilixContainer, app: Express) => {
  const router = Router()

  // needed for calls from web (aka callcenter)
  // router.post('/token', wrap(container.resolve('callTokenGeneratorController')))
  // router.post('/twilio/voice', wrap(container.resolve('outgoingCallWebhookController')))

  router.post('/twilio/:callId/gather', wrap(container.resolve('inputGatheredWebhookController')))
  router.post('/twilio/:callId/done', wrap(container.resolve('callDoneWebhook')))
  router.post('/twilio/:callId/machine-detection', wrap(container.resolve('machineDetectionWebhookController')))
  router.post('/virtual-caller/start', wrap(container.resolve('startVirtualCallerController')))

  app.use('/calls', router)
}
