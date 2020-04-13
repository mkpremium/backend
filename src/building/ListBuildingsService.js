export class ListBuildingsService {
  constructor (buildingRepository) {
    this.buildingRepository = buildingRepository
  }

  buildingsOfId (ids) {
    return this.buildingRepository.listById(typeof ids === 'string' ? [ids] : ids)
  }
}
