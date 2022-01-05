import Promise from 'bluebird'
import _ from 'lodash'
import fromJSON from 'tcomb/lib/fromJSON'

import { logger } from '../../infrastructure/logger'
import { utc } from '../../lib/date'
import { Worksheet, WorkSheetStatus } from '../../worksheet/domain/worksheet'
import { LegacyWorksheetRepository } from '../../worksheet/models/worksheet-repository'

let limit = 100

export async function moveWorksheetOutOfFreezer (argLimit = 100, buildingsRepository, daysInFreezer) {
  limit = argLimit
  logger.info('starting to move worksheets from freezer settings', { daysInFreezer })
  await moveNoSaleWorksheets(daysInFreezer, buildingsRepository)
  await moveFreezerWorksheets(daysInFreezer, buildingsRepository)
  logger.info('end of freezer process')
}

export async function moveFreezerWorksheets (daysInFreezer, buildingsRepository) {
  const maxDays = utc().subtract(daysInFreezer, 'days').toDate()
  const repository = new LegacyWorksheetRepository()
  const queryBuilder = repository.getQueryBuilder()
    .where('inFreezer = ?', true)
    .where('statusChangedAt IS NOT NULL')
    .where('statusChangedAt <= ?', maxDays)
    .where(`status IN ${JSON.stringify([ WorkSheetStatus.NO_SALE, WorkSheetStatus.MEETING ])}`)
    .limit(limit)

  const worksheets = await repository.query(queryBuilder)
  return pullOutFreezer(worksheets, buildingsRepository)
}

export async function moveNoSaleWorksheets (daysInFreezer, buildingsRepository) {
  const dateDaysAgo = utc().subtract(daysInFreezer, 'days').toDate()
  const repository = new LegacyWorksheetRepository()
  const queryBuilder = repository.getQueryBuilder()
    .where('status = ?', WorkSheetStatus.NO_SALE)
    .where('statusChangedAt IS NOT NULL')
    .where('statusChangedAt <= ?', dateDaysAgo)
    .limit(limit)

  const worksheets = await repository.query(queryBuilder)
  return pullOutFreezer(worksheets, buildingsRepository)
}

async function pullOutFreezer (worksheets, buildingsRepository) {
  if (!worksheets || worksheets.length === 0) {
    return
  }

  const repository = new LegacyWorksheetRepository()
  const updatedWorksheets = worksheets.map(worksheet => {
    logger.info(`moving worksheet out freezer`, { statusChangedAt: worksheet.statusChangedAt, id: worksheet.id })
    try {
      return fromJSON(worksheet, Worksheet).pullOutFreezer(WorkSheetStatus.AVAILABLE)
    } catch (error) {
      console.log('Could not pull worksheet out of freezer', {
        ...error,
        errorMessage: error.message,
        worksheetId: worksheet.id
      })
    }
  }).filter(Boolean)

  if (updatedWorksheets.length === 0) {
    return
  }

  const saveWorksheet = async (worksheet) => {
    await repository.save(worksheet, false)
  }

  await Promise.map(updatedWorksheets, saveWorksheet, { concurrency: 1 })
  const outOfFreezerBuildingIds = _.flatMap(updatedWorksheets.map(({ relatedBuildingIds }) => relatedBuildingIds))
  await buildingsRepository.pullBuildingsOutOfFreezer(outOfFreezerBuildingIds)
}
