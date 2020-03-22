import { UserRepository } from './UserRepository'

export const createMeController = couchbaseAdapter => {
  const usersRepository = new UserRepository(couchbaseAdapter)

  return async (req, res) => {
    const user = await usersRepository.getUserOfId(req.user.operator.id)
    res.json({
      featuredOwners: user.featuredOwners ? user.featuredOwners : []
    })
  }
}
