import routes from './routes'
import restringedHoursRoutes from './restringed-hours/routes'
import profitGoalsRoutes from './ProfitGoal/routes'

import './types'
import jwt from '../middleware/jwt'

export default (app) => {
  const secured = jwt().unless({
    path: [
      '/operators/login',
      '/operators/refresh-token'
    ]
  })

  app.use('/operators', secured, routes)
  app.use('/operators/restringed-hours', secured, restringedHoursRoutes)
  app.use('/operators/profit', secured, profitGoalsRoutes)
}
