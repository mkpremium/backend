import { ListBuildingsService } from '../service/list-buildings.service'

interface ListingBuildingControllerDeps {
  listBuildingsService: ListBuildingsService
}

export const createListBuildingsController = ({ listBuildingsService }: ListingBuildingControllerDeps) => async (req, res) => {
  if (req.query.id) {
    res.send(await listBuildingsService.buildingsOfId(req.query.id))
  } else if (req.query.allAssignedToMe !== undefined) {
    res.send(await listBuildingsService.buildingsAssignedTo(req.user.operator.id))
  } else {
    res.status(400).json({ error: 'No id or allAssignedToMe provided' })
  }
}
