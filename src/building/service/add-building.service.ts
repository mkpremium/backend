import { DataSource } from 'typeorm'
import { BuildingProps } from '../building'
import { Building } from '../building.entity'
import { Worksheet } from '../../worksheet/worksheet.entity'

type AddBuildingCommand = BuildingProps

export class AddBuildingService {
  constructor (private ormDataSource: DataSource) {
  }

  async addBuilding (cmd: AddBuildingCommand) {
    return await this.ormDataSource.transaction(async manager => {
      const building = await manager.save(Building, cmd)
      const worksheetData = {
        building: {id: building.id },
        status: 'LOOKING_MEETING' as const,
      }
      const worksheet = await manager.save(Worksheet, worksheetData)

      return [building, worksheet] as [Building, Worksheet]
    })
  }
}
