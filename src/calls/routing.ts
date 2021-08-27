import { Express, Router } from 'express'
import { AwilixContainer } from 'awilix'
import { wrap } from 'express-promise-wrap'
import jwt from '../middleware/jwt'

export const callsRoutes = (container: AwilixContainer, app: Express) => {
  const router = Router()

  // needed for calls from web (aka callcenter)
  // router.post('/token', wrap(container.resolve('callTokenGeneratorController')))
  // router.post('/twilio/voice', wrap(container.resolve('outgoingCallWebhookController')))

  router.post('/twilio/:callId/gather', wrap(container.resolve('inputGatheredWebhookController')))
  router.post('/twilio/:callId/done', wrap(container.resolve('callFinishedWebhookController')))
  router.post('/twilio/:callId/machine-detection', wrap(container.resolve('machineDetectionWebhookController')))
  // router.post('/twilio/sms', wrap(container.resolve('twilioSMSWebhookController')))
  router.post('/twilio/incoming', wrap(container.resolve('twilioIncomingCallController')))
  router.post('/virtual-caller/start', wrap(container.resolve('startVirtualCallerController')))
  router.post('/virtual-caller/today', wrap(container.resolve('virtualCallerTodayStatsController')))

  // VirtualCaller CRUD
  router.get('/virtual-callers', wrap(container.resolve('listVirtualCallersController')))
  router.patch('/virtual-callers/:callerId', wrap(container.resolve('patchVirtualCallerController')))
  router.post('/virtual-callers', wrap(container.resolve('createVirtualCallerController')))

  const secured = jwt().unless({
    path: [
      // '/calls/twilio/voice', // needed for calls from web (aka callcenter)
      /^\/calls\/twilio\/[0-9a-z-]+\/gather$/,
      /^\/calls\/twilio\/[0-9a-z-]+\/done/,
      /^\/calls\/twilio\/[0-9a-z-]+\/machine-detection$/,
      // /^\/calls\/twilio\/sms$/,
      /^\/calls\/twilio\/incoming$/,
    ]
  })

  app.use('/calls', secured, router)
}
