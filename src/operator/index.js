import jwt from '../middleware/jwt'
import profitGoalsRoutes from './ProfitGoal/routes'
import restringedHoursRoutes from './restringed-hours/routes'
import routes from './routes'

import './types'

export default (app) => {
  const secured = jwt().unless({
    path: [
      '/operators/login',
      '/operators/refresh-token',
      // '/calls/twilio/voice', // needed for calls from web (aka callcenter)
      /^calls\/twilio\/[0-9a-z]*\/gather$/,
      /^calls\/twilio\/[0-9a-z]*\/done$/,
      /^calls\/twilio\/[0-9a-z]*\/machine-detection$/
    ]
  })

  app.use('/operators', secured, routes)
  app.use('/operators/restringed-hours', secured, restringedHoursRoutes)
  app.use('/operators/profit', secured, profitGoalsRoutes)
}
