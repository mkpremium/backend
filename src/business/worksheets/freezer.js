import Promise from 'bluebird'
import _ from 'lodash'
import fromJSON from 'tcomb/lib/fromJSON'
import { utc } from '../../lib/date'
import { OwnerRepository } from '../../owner/models'
import { SystemPreferencesRepository } from '../../system-preferences/models'
import { OwnerStatus } from '../../types/enums'
import { Worksheet, WorkSheetStatus } from '../../worksheet/worksheet'
import { WorksheetRepository } from '../../worksheet/models/worksheet-repository'

import { logger } from '../../infrastructure/logger'

let changeNothing
let limit = 100

export async function moveWorksheetOutOfFreezer (dryRun = false, argLimit = 100, buildingRepository) {
  changeNothing = dryRun
  limit = argLimit
  const { freezer } = await SystemPreferencesRepository.getPreferences()
  logger.info('starting to move worksheets from freezer settings', { freezer })
  await moveNoSaleWorksheets(freezer, buildingRepository)
  await moveFreezerWorksheets(freezer, buildingRepository)
  logger.info('end of freezer process')
}

export async function moveFreezerWorksheets ({ daysInFreezer, provinces }, buildingRepository) {
  const maxDays = utc().subtract(daysInFreezer, 'days').toDate()
  const repository = new WorksheetRepository()
  const queryBuilder = repository.getQueryBuilder()
    .where('inFreezer = ?', true)
    .where('statusChangedAt IS NOT NULL')
    .where('statusChangedAt <= ?', maxDays)
    .where(`status IN ${JSON.stringify([ WorkSheetStatus.NO_SALE, WorkSheetStatus.MEETING ])}`)
    .limit(limit)

  if (provinces.length > 0) {
    queryBuilder.where(`buildingAddress.province IN ${JSON.stringify(provinces)}`)
  }

  const worksheets = await repository.query(queryBuilder)
  return pullOutFreezer(worksheets, buildingRepository)
}

export async function moveNoSaleWorksheets ({ daysInFreezer, provinces }, buildingRepository) {
  const dateDaysAgo = utc().subtract(daysInFreezer, 'days').toDate()
  const repository = new WorksheetRepository()
  const queryBuilder = repository.getQueryBuilder()
    .where('status = ?', WorkSheetStatus.NO_SALE)
    .where('statusChangedAt IS NOT NULL')
    .where('statusChangedAt <= ?', dateDaysAgo)
    .limit(limit)

  if (provinces.length > 0) {
    queryBuilder.where(`buildingAddress.province IN ${JSON.stringify(provinces)}`)
  }

  const worksheets = await repository.query(queryBuilder)
  return pullOutFreezer(worksheets, buildingRepository)
}

async function pullOutFreezer (worksheets, buildingRepository) {
  if (!worksheets || worksheets.length === 0) {
    return
  }

  if (changeNothing) {
    worksheets.forEach(worksheet => {
      logger.info(`[dry-run] moving out freezer worksheet`, {
        statusChangedAt: worksheet.statusChangedAt,
        id: worksheet.id,
        status: worksheet.status
      })
    })
    return
  }

  const repository = new WorksheetRepository()
  const updatedWorksheets = worksheets.map(worksheet => {
    logger.info(`moving worksheet out freezer`, { statusChangedAt: worksheet.statusChangedAt, id: worksheet.id })
    return fromJSON(worksheet, Worksheet).pullOutFreezer(WorkSheetStatus.AVAILABLE)
  })

  if (updatedWorksheets.length === 0) {
    return
  }

  const saveWorksheet = async (worksheet) => {
    await repository.save(worksheet, false)
    await moveOwnerStatus(worksheet.relatedBuildingIds[ 0 ])
  }

  await Promise.map(updatedWorksheets, saveWorksheet, { concurrency: 1 })
  const outOfFreezerBuildingIds = _.flatMap(updatedWorksheets.map(({ relatedBuildingIds }) => relatedBuildingIds))
  await buildingRepository.pullBuildingsOutOfFreezer(outOfFreezerBuildingIds)
}

export async function moveOwnerStatus (buildingId) {
  const repository = new OwnerRepository()
  const owners = await repository.findOwnersByBuildingId(buildingId)
  if (owners.length === 0) {
    logger.info('there is not owners for this worksheet to change', { buildingId })
    return
  }

  const updatedOwners = owners.map(owner => {
    return owner.pullOutFreezer(OwnerStatus.VERIFIED)
  })

  if (updatedOwners.length > 0) {
    await Promise.map(updatedOwners, owner => repository.save(owner, false), { concurrency: 3 })
  }
}
