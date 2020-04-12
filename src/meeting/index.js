import jwt from '../middleware/jwt'
import { meetingRoutes } from './routes'

export default (app, { getUserMeetingsService }) => {
  const secured = jwt()
  app.use('/', secured, meetingRoutes(getUserMeetingsService))
}
