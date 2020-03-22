import jwt from '../middleware/jwt'
import { userRoutes } from './routes'

export default (app, { usersRepository }) => {
  const secured = jwt()
  app.use('/', secured, userRoutes(usersRepository))
}
