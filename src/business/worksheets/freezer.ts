import { Promise as BirdPromise } from 'bluebird'
import _ from 'lodash'
import fromJSON from 'tcomb/lib/fromJSON'

import { logger } from '../../infrastructure/logger'
import { utc } from '../../lib/date'
import { pullOutFreezer, Worksheet, WorkSheetStatus } from '../../worksheet/domain/worksheet'
import { LegacyWorksheetRepository } from '../../worksheet/models/worksheet-repository'

export async function moveWorksheetOutOfFreezer (limit, buildingsRepository, daysInFreezer) {
  logger.info('starting to move worksheets from freezer settings', { daysInFreezer })
  const maxDays = utc().subtract(daysInFreezer, 'days').toDate()
  const repository = new LegacyWorksheetRepository()
  const queryBuilder = repository.getQueryBuilder()
    .where('inFreezer = ?', true)
    .where('viewedAt IS NOT NULL')
    .where('viewedAt <= ?', maxDays)
    .where(`status IN ${JSON.stringify([ WorkSheetStatus.NO_SALE, WorkSheetStatus.MEETING ])}`)
    .limit(limit)

  const worksheets = await repository.query(queryBuilder)
  return pullWorksheetsOutOfFreezer(worksheets, buildingsRepository)
}

async function pullWorksheetsOutOfFreezer (worksheets, buildingsRepository) {
  if (!worksheets || worksheets.length === 0) {
    return
  }

  const repository = new LegacyWorksheetRepository()
  const updatedWorksheets = worksheets.map(worksheet => {
    logger.info(`moving worksheet out freezer`, { statusChangedAt: worksheet.statusChangedAt, id: worksheet.id })
    try {
      return pullOutFreezer(fromJSON(worksheet, Worksheet), WorkSheetStatus.AVAILABLE)
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

  await BirdPromise.map(updatedWorksheets, async (worksheet) => {
    await repository.save(worksheet)
  }, { concurrency: 1 })
  const outOfFreezerBuildingIds = _.flatMap(updatedWorksheets.map(({ relatedBuildingIds }) => relatedBuildingIds))

  await buildingsRepository.pullBuildingsOutOfFreezer(outOfFreezerBuildingIds)
}
