import { createScheduleEventsRoutes } from './routes'

import './types'
import jwt from '../middleware/jwt'

export default (app, { createMeetingService, scheduledCallsService, eventBus }) => {
  const secured = jwt()

  app.use('/scheduled-events',
    secured,
    createScheduleEventsRoutes(
      createMeetingService,
      scheduledCallsService,
      eventBus
    )
  )
}
