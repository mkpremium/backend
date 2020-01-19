import {addStockRoutes} from './routes.js'
import './types'
import jwt from '../middleware/jwt'

export default (app, { couchbaseBucket }) => {
  const secured = jwt()
  app.use('/stock', secured, addStockRoutes(couchbaseBucket))
}
