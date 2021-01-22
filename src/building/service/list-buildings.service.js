export class ListBuildingsService {
  constructor (commercialsBuildingRepository) {
    this.commercialsBuildingRepository = commercialsBuildingRepository
  }

  buildingsOfId (ids) {
    return this.commercialsBuildingRepository.listById(typeof ids === 'string' ? [ids] : ids)
  }

  buildingsAssignedTo (propertyAgentId) {
    return this.commercialsBuildingRepository.listAssignedToPropertyAgentOfId(propertyAgentId)
  }
}
