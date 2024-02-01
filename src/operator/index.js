import { wrap } from 'express-promise-wrap'

import './types'
import { setProfitGoalToOperatorControllerFactory } from './ProfitGoal/controllers'
import restringedHoursRoutes from './restringed-hours/routes'
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
  app.post('/operators/profit/goal', secured, wrap(
    setProfitGoalToOperatorControllerFactory(diContainer.resolve('operatorRepository'))))
}
