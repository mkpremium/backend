import { RequestHandler } from 'express'
import { VirtualCallersRepository } from '../repository/virtual-callers.repository'

interface Deps {
  virtualCallersRepository: VirtualCallersRepository
}

export function createListVirtualCallersController ({ virtualCallersRepository }: Deps): RequestHandler {
  return async function (req, res) {
    const virtualCallers = await virtualCallersRepository.all()
    res.json(virtualCallers)
  }
}
