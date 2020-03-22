import jwt from '../middleware/jwt'
import profitGoalsRoutes from './ProfitGoal/routes'
import restringedHoursRoutes from './restringed-hours/routes'
import routes from './routes'

import './types'

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
