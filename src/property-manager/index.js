import jwt from '../middleware/jwt'
import { createPropertyManagerRouter } from './routes'

export const init = (app, container) => {
  const secured = jwt()

  app.use('/property-manager', secured, createPropertyManagerRouter(container.resolve('stockRepository')))
}
