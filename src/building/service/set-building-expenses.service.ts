import { BuildingsRepository } from '../repository/buildings.repository'

export class SetBuildingExpensesService {
  private buildingsRepository: BuildingsRepository

  constructor({ buildingsRepository }) {
    this.buildingsRepository = buildingsRepository
  }

  async setTotalExpensesAmount(buildingId, totalAmount) {
    const building = await this.buildingsRepository.get(buildingId)
    const updatedBuilding = building.withTotalExpensesAmount(totalAmount)

    return this.buildingsRepository.save(updatedBuilding)
  }
}
