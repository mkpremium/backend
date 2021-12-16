import { RequestHandler } from '../../infrastructure/request-handler'
import { BuildingsRepository } from '../repository/buildings.repository'
import { Building } from '../building'

interface Deps {
  buildingsRepository: BuildingsRepository
}

export function createBuildingController (deps: Deps): RequestHandler {
  return async function (req, res): Promise<void> {
    return deps.buildingsRepository.save(Building(req.body))
      .then(building => {
        res.json(building)
      })
  }
}

