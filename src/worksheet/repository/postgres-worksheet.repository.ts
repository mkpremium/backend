import { PostgresRepository } from '../../infrastructure/postgres/postgres-repository'
import { WorksheetProps } from '../domain/worksheet'
import { Worksheet } from '../worksheet.entity'
import { DeepPartial, EntityTarget } from 'typeorm'
import { WorksheetRepository } from './worksheet.repository'

export class PostgresWorksheetRepository extends PostgresRepository<WorksheetProps, Worksheet> implements WorksheetRepository {
  protected relations = {
    building: true,
    queue: true,
    lastViewedBy: true,
  }

  async ofBuildingId(buildingId: string): Promise<WorksheetProps> {
    const entity = await this.repository.findOne({where: {building: {id: buildingId}}, relations: this.relations})
    return this.entityToStruct(entity)
  }

  protected entityToStruct(entity: Worksheet): WorksheetProps {
    return {
      id: entity.id,
      status: entity.status,
      queueId: entity.queue?.id,
      relatedBuildingIds: [entity.building.id],
      statusChangedAt: entity.lastStatusChangedAt,
      viewedAt: entity.lastViewedAt,
      viewedBy: entity.lastViewedBy?.id,
      statusChangeReason: entity.statusChangeReason,
      buildingAddress: entity.building.address,
    }
  }

  protected structToEntity(struct: WorksheetProps): DeepPartial<Worksheet> {
    return this.repository.create({
      id: struct.id,
      status: struct.status,
      lastStatusChangedAt: struct.statusChangedAt,
      statusChangeReason: struct.statusChangeReason,
      lastViewedAt: struct.viewedAt,
      lastViewedBy: struct.viewedBy ? {id: struct.viewedBy} : null,
      building: {id: struct.relatedBuildingIds[0]},
      createdAt: new Date(),
      updatedAt: new Date(),
      queue: struct.queueId ? {id: struct.queueId} : null,
    })
  }

  protected getEntityTarget(): EntityTarget<Worksheet> {
    return Worksheet
  }
}
