export const createSetFeaturedOwnerController = (featuredOwnerService) => async (req, res) => {
  await featuredOwnerService.setFeaturedOwnerForBuildingAndPropertyManager(
    req.user.operator.id,
    req.params.id,
    req.body.ownerId
  )
  res.sendStatus(200)
}
