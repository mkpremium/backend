import jwt from '../middleware/jwt'
import { meetingRoutes } from './routes'

export default (app) => {
  const secured = jwt()
  app.use('/', secured, meetingRoutes())
}
