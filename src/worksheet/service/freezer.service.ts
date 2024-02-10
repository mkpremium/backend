import { logger } from '../../infrastructure/logger'
import { WorkSheetStatus, WorksheetStatusType } from '../domain/worksheet'
import type { EntityManager } from 'typeorm'
import { Worksheet as WorksheetEntity } from '../worksheet.entity'
import moment from 'moment'

export class FreezerService {
  constructor (
    private readonly entityManager: EntityManager
  ) {
  }

  async moveWorksheetOutOfFreezer (daysInFreezer: number) {
    logger.info('starting to move worksheets from freezer settings', { daysInFreezer })

    await this.entityManager.createQueryBuilder(WorksheetEntity, 'worksheet')
      .update(WorksheetEntity)
      .set({ queue: null, status: WorkSheetStatus.AVAILABLE as WorksheetStatusType })
      .where('worksheet.status IN (:...statuses)',
        { statuses: [WorkSheetStatus.NO_SALE, WorkSheetStatus.MEETING] })
      .andWhere('worksheet."lastStatusChangedAt" IS NOT NULL')
      .andWhere('worksheet."lastStatusChangedAt" <= :timestampLimit',
        { timestampLimit: moment().subtract(daysInFreezer, 'days').toDate() })
      .execute()
  }
}
