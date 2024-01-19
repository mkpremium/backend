import { logger } from "../../infrastructure/logger";
import { utc } from "../../lib/date";
import { LegacyWorksheetRepository } from "../models/worksheet-repository";
import { pullOutFreezer, Worksheet, WorksheetProps, WorkSheetStatus, WorksheetStatusType } from "../domain/worksheet";
import fromJSON from "tcomb/lib/fromJSON";
import { Promise as BirdPromise } from "bluebird";
import _ from "lodash";
import { CouchbaseBuildingsRepository } from "../../building/repository/couchbase-building.repository";

export class FreezerService {
  constructor(
    private readonly couchbaseBuildingsRepository: CouchbaseBuildingsRepository,
    private readonly legacyWorksheetRepository: LegacyWorksheetRepository
  ) {
  }

  async moveWorksheetOutOfFreezer(daysInFreezer: number, limit: number) {
    logger.info('starting to move worksheets from freezer settings', {daysInFreezer})

    const dateLimit = utc().subtract(daysInFreezer, 'days').toDate()
    const queryBuilder = this.legacyWorksheetRepository.getQueryBuilder()
      .where('inFreezer = ?', true)
      .where('statusChangedAt IS NOT NULL')
      .where('statusChangedAt <= ?', dateLimit)
      .where(`status IN ${JSON.stringify([WorkSheetStatus.NO_SALE, WorkSheetStatus.MEETING])}`)
      .limit(limit)

    const worksheets = await this.legacyWorksheetRepository.query(queryBuilder)
    return pullWorksheetsOutOfFreezer(worksheets, this.couchbaseBuildingsRepository)
  }
}

async function pullWorksheetsOutOfFreezer(worksheets: WorksheetProps[], buildingsRepository: CouchbaseBuildingsRepository) {
  if (!worksheets || worksheets.length === 0) {
    return
  }

  const repository = new LegacyWorksheetRepository()
  const updatedWorksheets = worksheets.map(worksheet => {
    logger.info(`moving worksheet out freezer`, {statusChangedAt: worksheet.statusChangedAt, id: worksheet.id})
    try {
      return pullOutFreezer(fromJSON(worksheet, Worksheet), WorkSheetStatus.AVAILABLE as WorksheetStatusType)
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
  }, {concurrency: 1})
  const outOfFreezerBuildingIds = _.flatMap(updatedWorksheets.map(({relatedBuildingIds}) => relatedBuildingIds))

  await buildingsRepository.pullBuildingsOutOfFreezer(outOfFreezerBuildingIds)
}
