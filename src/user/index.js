import jwt from '../middleware/jwt'
import { userRoutes } from './routes'
import { asClass } from 'awilix'
import { UserRepository } from './UserRepository'
import { AddFavoriteBuildingService } from './AddFavoriteBuildingService'
import { DeleteFavoriteBuildingService } from './DeleteFavoriteBuildingService'

export default (
  app,
  { usersRepository, addFavoriteBuildingService, deleteFavoriteBuildingService },
  awilixContainer
) => {
  const secured = jwt()
  awilixContainer.register({
    usersRepository: asClass(UserRepository).classic(),
    addFavoriteBuildingService: asClass(AddFavoriteBuildingService).classic(),
    deleteFavoriteBuildingService: asClass(DeleteFavoriteBuildingService).classic()
  })

  app.use('/', secured, userRoutes(awilixContainer))
}
