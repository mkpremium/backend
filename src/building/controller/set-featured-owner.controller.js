export const createSetFeaturedOwnerController = ({ featuredOwnerService }) => async (req, res) => {
  await featuredOwnerService.setBuildingFeaturedOwner(
    req.params.buildingId,
    req.body.ownerId
  )
  res.json()
}
