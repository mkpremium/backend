import './types'
import routes from './routes'
import jwt from '../middleware/jwt'

export default (app) => {
  const secured = jwt()
  app.use('/cadastre', secured, routes)
}
