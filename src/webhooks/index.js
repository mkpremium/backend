import { webhookCallsRouter } from '../calls/routes'
import morganBody from 'morgan-body'
import { isTest } from '../../config'

export default (app) => {
  morganBody(app, {
    skip: (req, res) => {
      return isTest() || !req.originalUrl.includes('/webhook')
    }
  })
  app.use('/webhook/calls', webhookCallsRouter)
}
