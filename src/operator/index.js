import { wrap } from 'express-promise-wrap'

import './types'
import { setProfitGoalToOperatorControllerFactory } from './ProfitGoal/controllers'
import { operatorRouter } from './routes'

export default async (app, diContainer, jwt) => {
  const secured = jwt.unless({
    path: [
      '/operators/login',
      '/operators/refresh-token'
    ]
  })
  const usePostgres = diContainer.resolve('usePostgres')
  if (!usePostgres) {
    const { restringedHoursRoutes } = await import('./restringed-hours/routes')
    app.use('/operators/restringed-hours', secured, restringedHoursRoutes)
  }

  app.use('/operators', secured, operatorRouter(diContainer))
  app.post('/operators/profit/goal', secured, wrap(
    setProfitGoalToOperatorControllerFactory(diContainer.resolve('operatorRepository'))))
}
