import routes from './routes'
import jwt from '../middleware/jwt'

export function statRoutes (app) {
  app.use('/stats', jwt(), routes)
}
