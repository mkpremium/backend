import routes from './routes'

import { OperatorActions } from './types'
import jwt from '../middleware/jwt'
import { OperatorStats } from './models'

export default (app, awilixContainer) => {
  const secured = jwt()

  const eventBus = awilixContainer.resolve('eventBus')
  eventBus.on('worksheet.next_in_queue_taken',
    ({ by, source }) => OperatorStats.registerAction(by, OperatorActions.VIEW_WORKSHEET, source))
  eventBus.on('scheduled_events.call_scheduled',
    ({ userId }) => OperatorStats.registerAction(userId, OperatorActions.SCHEDULE_CALL))

  app.use('/stats', secured, routes)
}
