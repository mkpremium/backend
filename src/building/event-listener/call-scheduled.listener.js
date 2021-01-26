export const createScheduledCallListener = ({ featuredOwnerService }) => ({buildingId, ownerId}) => {
  return featuredOwnerService.setBuildingFeaturedOwner(buildingId, ownerId)
}
