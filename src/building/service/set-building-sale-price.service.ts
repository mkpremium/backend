import t from 'tcomb'
import { LegacyBuildingRepository } from '../models'

const setBuildingSalePriceCommand = t.struct<{buildingId: string, salePrice: number}>({
  buildingId: t.String,
  salePrice: t.Number
})

export class SetBuildingSalePriceService {
  constructor (private legacyBuildingsRepository: LegacyBuildingRepository) {
  }

  async setBuildingSalePrice (cmd: {buildingId: string, salePrice: number}) {
    const { buildingId, salePrice } = setBuildingSalePriceCommand(cmd)

    const building = await this.legacyBuildingsRepository.findById(buildingId)
    const updatedBuilding = t.update(building, {
      salePrice: {
        $set: salePrice
      }
    })

    return this.legacyBuildingsRepository.save(updatedBuilding)
  }
}
