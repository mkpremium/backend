import { logger } from '../../infrastructure/logger'
import { utc } from '../../lib/date'
import type { LegacyWorksheetRepository } from '../models/worksheet-repository'
import { pullOutFreezer, Worksheet, WorksheetProps, WorkSheetStatus, WorksheetStatusType } from '../domain/worksheet'
import fromJSON from 'tcomb/lib/fromJSON'
import { Promise as BirdPromise } from 'bluebird'
import _ from 'lodash'
import type { CouchbaseBuildingsRepository } from '../../building/repository/couchbase-building.repository'
import type { EntityManager } from 'typeorm'
import { Worksheet as WorksheetEntity } from '../worksheet.entity'
import moment from 'moment'

export class FreezerService {
  constructor (
    private readonly couchbaseBuildingsRepository: CouchbaseBuildingsRepository,
    private readonly legacyWorksheetRepository: LegacyWorksheetRepository,
    private readonly usePostgres: boolean,
    private readonly entityManager: EntityManager
  ) {
  }

  async moveWorksheetOutOfFreezer (daysInFreezer: number, limit: number) {
    logger.info('starting to move worksheets from freezer settings', { daysInFreezer })

    await (this.usePostgres ? this.doPostgres(daysInFreezer) : this.doCouchbase(daysInFreezer, limit))
  }

  private async doPostgres (daysInFreezer: number) {
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

  private async doCouchbase (daysInFreezer: number, limit: number) {
    const dateLimit = utc().subtract(daysInFreezer, 'days').toDate()
    const queryBuilder = this.legacyWorksheetRepository.getQueryBuilder()
      .where('inFreezer = ?', true)
      .where('statusChangedAt IS NOT NULL')
      .where('statusChangedAt <= ?', dateLimit)
      .where(`status IN ${JSON.stringify([WorkSheetStatus.NO_SALE, WorkSheetStatus.MEETING])}`)
      .limit(limit)

    const worksheets = await this.legacyWorksheetRepository.query(queryBuilder)
    await pullWorksheetsOutOfFreezer(worksheets, this.couchbaseBuildingsRepository, this.legacyWorksheetRepository)
  }
}

async function pullWorksheetsOutOfFreezer (
  worksheets: WorksheetProps[],
  buildingsRepository: CouchbaseBuildingsRepository,
  repository: LegacyWorksheetRepository
) {
  if (!worksheets || worksheets.length === 0) {
    return
  }

  const updatedWorksheets = worksheets.map(worksheet => {
    logger.info('moving worksheet out freezer', { statusChangedAt: worksheet.statusChangedAt, id: worksheet.id })
    try {
      return pullOutFreezer(fromJSON(worksheet, Worksheet), WorkSheetStatus.AVAILABLE as WorksheetStatusType)
    } catch (error) {
      logger.log('Could not pull worksheet out of freezer', {
        ...error,
        errorMessage: error.message,
        worksheetId: worksheet.id
      })
      return undefined
    }
  }).filter(Boolean)

  if (updatedWorksheets.length === 0) {
    return
  }

  await BirdPromise.map(updatedWorksheets, async (worksheet) => {
    await repository.save(worksheet)
  }, { concurrency: 1 })
  const outOfFreezerBuildingIds = _.flatMap(updatedWorksheets.map(({ relatedBuildingIds }) => relatedBuildingIds))

  await buildingsRepository.pullBuildingsOutOfFreezer(outOfFreezerBuildingIds)
}
