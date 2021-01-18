/**
 * @param {OwnerRepository} legacyOwnerRepository
 * @return {function(*, *)}
 */
export const createListBuildingOwnersController = ({ ownersRepository }) => async (req, res) => {
  const owners = await ownersRepository.buildingOwners(req.params.buildingId)
  res.json(owners)
  return Promise.resolve()
}
