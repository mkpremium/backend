import { createScheduleEventsRoutes } from './routes'

import './types'
import jwt from '../middleware/jwt'

export default (app, { createMeetingService, scheduledCallsService }) => {
  const secured = jwt()

  app.use('/scheduled-events', secured, createScheduleEventsRoutes(createMeetingService, scheduledCallsService))
}
