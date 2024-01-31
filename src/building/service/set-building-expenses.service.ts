import { BuildingsRepository } from '../repository/buildings.repository'
import { withTotalExpensesAmount } from '../building'

export class SetBuildingExpensesService {
  private buildingsRepository: BuildingsRepository

  constructor ({ buildingsRepository }) {
    this.buildingsRepository = buildingsRepository
  }

  async setTotalExpensesAmount (buildingId, totalAmount) {
    const updatedBuilding = withTotalExpensesAmount(
      await this.buildingsRepository.get(buildingId),
      totalAmount
    )

    return this.buildingsRepository.save(updatedBuilding)
  }
}
