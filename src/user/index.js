import jwt from '../middleware/jwt'
import { userRoutes } from './routes'
import { asValue } from 'awilix'

export default (
  app,
  { usersRepository, addFavoriteBuildingService, deleteFavoriteBuildingService },
  awilixContainer
) => {
  const secured = jwt()
  awilixContainer.register({
    usersRepository: asValue(usersRepository)
  })
  app.use('/', secured, userRoutes(usersRepository, addFavoriteBuildingService, deleteFavoriteBuildingService))
}
