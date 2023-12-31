export class ListBuildingsService {
  constructor (buildingsReadRepository) {
    this.buildingsReadRepository = buildingsReadRepository
  }

  buildingsOfId (ids) {
    return this.buildingsReadRepository.listById(typeof ids === 'string' ? [ids] : ids)
  }

  buildingsAssignedTo (propertyAgentId) {
    return this.buildingsReadRepository.listAssignedToPropertyAgentOfId(propertyAgentId)
  }
}
