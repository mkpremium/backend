import type { SearchOwnerOrBuildingService } from '../service/search-owner-or-building.service'

export const createSearchOwnersController = (searchOwnerOrBuildingService: SearchOwnerOrBuildingService) => async (req, res) => {
  const phoneNumber = req.body.phoneNumber
  const foundOwners = await searchOwnerOrBuildingService.search(phoneNumber)

  res.json(foundOwners)
}
