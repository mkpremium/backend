import { RequestHandler } from '../../infrastructure/request-handler'
import { OwnerRepository } from '../repository/owner.repository'

interface Deps {
  ownersRepository: OwnerRepository,
}

export function getOwnerController ({ ownersRepository }: Deps): RequestHandler {
  return async function (req, res): Promise<void> {
    return ownersRepository.get(req.params.ownerId)
      .then(({
        id,
        name,
        featuredContact,
        person: { contacts }
      }) => {
        res.json({
          id,
          name,
          contacts,
          featuredContact
        })
      })
  }
}
