import t from 'tcomb'
import { BuildingsRepository } from '../repository/buildings.repository'

const setBuildingSalePriceCommand = t.struct<{buildingId: string, salePrice: number}>({
  buildingId: t.String,
  salePrice: t.Number
})

export class SetBuildingSalePriceService {
  constructor (private buildingsRepository: BuildingsRepository) {
  }

  async setBuildingSalePrice (cmd: {buildingId: string, salePrice: number}) {
    const { buildingId, salePrice } = setBuildingSalePriceCommand(cmd)

    const building = await this.buildingsRepository.get(buildingId)
    const updatedBuilding = t.update(building, {
      salePrice: {
        $set: salePrice
      }
    })

    return this.buildingsRepository.save(updatedBuilding)
  }
}
