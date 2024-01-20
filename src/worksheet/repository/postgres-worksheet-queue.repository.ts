import { WorksheetQueueProps } from '../domain/queue'
import { WorksheetQueueRepository } from './worksheet-queue.repository'
import { PostgresRepository } from '../../infrastructure/postgres/postgres-repository'
import { WorksheetQueue } from '../worksheet-queue.entity'
import { DeepPartial, EntityTarget } from 'typeorm'
import { BaseEntity } from '../../infrastructure/entity'
import { Worksheet } from "../worksheet.entity";
import { QueueItemStatus } from "../models/queue-item";

export class PostgresWorksheetQueueRepository extends PostgresRepository<WorksheetQueueProps & Partial<BaseEntity>, WorksheetQueue>
  implements WorksheetQueueRepository {
  relations = {
    worksheets: {
      heldBy: true
    },
  }

  list (): Promise<WorksheetQueueProps[]> {
    throw new Error('Method not implemented.')
  }

  protected structToEntity (struct: WorksheetQueueProps & Partial<BaseEntity>): DeepPartial<WorksheetQueue> {
    return {
      id: struct.id,
      name: struct.name,
      worksheets: struct.worksheets?.map(({ worksheetId }) => ({ id: worksheetId })) ?? [],
      source: struct.source,
      createdAt: struct.createdAt,
      updatedAt: struct.updatedAt,
    }
  }

  protected entityToStruct (entity: WorksheetQueue): WorksheetQueueProps {
    return {
      id: entity.id,
      name: entity.name,
      source: entity.source,
      worksheets: entity.worksheets.map(
        (ws) => ({
          worksheetId: ws.id,
          addedAt: ws.lastViewedAt,
          operatorId: ws.heldBy?.id,
          status: inferWorksheetQueueItemStatus(ws),
        })
      ),
    }
  }

  protected getEntityTarget (): EntityTarget<WorksheetQueue> {
    return WorksheetQueue
  }
}

function inferWorksheetQueueItemStatus(worksheet: Worksheet): QueueItemStatus {
  switch (true) {
    case !!worksheet.heldBy:
      return QueueItemStatus.OPENED
    case worksheet.status === "MEETING": // TODO: is there any other case?
      return QueueItemStatus.SCHEDULED
    default:
      return QueueItemStatus.AVAILABLE
  }
}
