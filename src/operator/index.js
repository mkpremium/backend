import profitGoalsRoutes from './ProfitGoal/routes'
import restringedHoursRoutes from './restringed-hours/routes'

import './types'
import { operatorRouter } from './routes'

export default (app, diContainer, jwt) => {
  const secured = jwt.unless({
    path: [
      '/operators/login',
      '/operators/refresh-token'
    ]
  })

  app.use('/operators', secured, operatorRouter(diContainer))
  app.use('/operators/restringed-hours', secured, restringedHoursRoutes)
  app.use('/operators/profit', secured, profitGoalsRoutes)
}
