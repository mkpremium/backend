import jwt from '../middleware/jwt'
import { createPropertyManagerRouter } from './routes'

export const init = (app, { stockRepository }) => {
  const secured = jwt()

  app.use('/property-manager', secured, createPropertyManagerRouter(stockRepository))
}
