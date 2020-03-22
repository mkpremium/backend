import jwt from '../middleware/jwt'
import { userRoutes } from './routes'

export default (app, { couchbaseAdapter }) => {
  const secured = jwt()
  app.use('/', secured, userRoutes(couchbaseAdapter))
}
