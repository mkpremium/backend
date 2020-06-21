import Promise from 'bluebird'
import debug from 'debug'
import _ from 'lodash'
import fromJSON from 'tcomb/lib/fromJSON'
import { utc } from '../../lib/date'
import { OwnerRepository } from '../../owner/models'
import { SystemPreferencesRepository } from '../../system-preferences/models'
import { OwnerStatus } from '../../types/enums'
import { Worksheet, WorkSheetStatus } from '../../types/worksheet'
import { WorksheetRepository } from '../../worksheet/models/worksheet'

const debugFreezer = debug('app:worksheets:freezer')

let changeNothing
let limit = 100

export async function moveWorksheetOutOfFreezer (dryRun = false, argLimit = 100, buildingRepository) {
  changeNothing = dryRun
  limit = argLimit
  const { freezer } = await SystemPreferencesRepository.getPreferences()
  debugFreezer('starting to move worksheets from freezer settings', freezer)
  await moveNoSaleWorksheets(freezer, buildingRepository)
  await moveFreezerWorksheets(freezer, buildingRepository)
  debugFreezer('end of freezer process')
}

export async function moveFreezerWorksheets ({ daysInFreezer, provinces }, buildingRepository) {
  const maxDays = utc().subtract(daysInFreezer, 'days').toDate()
  const repository = new WorksheetRepository()
  const queryBuilder = repository.getQueryBuilder()
    .where('inFreezer = ?', true)
    .where('statusChangedAt IS NOT NULL')
    .where('statusChangedAt <= ?', maxDays)
    .where(`status IN ${JSON.stringify([WorkSheetStatus.NO_SALE, WorkSheetStatus.MEETING])}`)
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
      debugFreezer(`[dry-run] moving out freezer worksheet '${worksheet.id}' with status ${worksheet.status}, last status changed at: '${worksheet.statusChangedAt}'`)
    })
    return
  }

  const repository = new WorksheetRepository()
  const updatedWorksheets = worksheets.map(worksheet => {
    debugFreezer(`moving out freezer worksheet '${worksheet.id}', last status changed at: '${worksheet.statusChangedAt}'`)
    return fromJSON(worksheet, Worksheet).pullOutFreezer(WorkSheetStatus.WITH_OWNER)
  })

  if (updatedWorksheets.length === 0) {
    return
  }

  const saveWorksheet = async (worksheet) => {
    await repository.save(worksheet, false)
    await moveOwnerStatus(worksheet.relatedBuildingIds[0])
  }

  await Promise.map(updatedWorksheets, saveWorksheet, { concurrency: 1 })
  const outOfFreezerBuildingIds = _.flatMap(updatedWorksheets.map(({relatedBuildingIds}) => relatedBuildingIds))
  await buildingRepository.pullBuildingsOutOfFreezer(outOfFreezerBuildingIds)
}

export async function moveOwnerStatus (buildingId) {
  const repository = new OwnerRepository()
  const owners = await repository.findOwnersByBuildingId(buildingId)
  if (owners.length === 0) {
    debugFreezer('there is not owners for this worksheet to change')
    return
  }

  const updatedOwners = owners.map(owner => {
    return owner.pullOutFreezer(OwnerStatus.VERIFIED)
  })

  if (updatedOwners.length > 0) {
    await Promise.map(updatedOwners, owner => repository.save(owner, false), { concurrency: 3 })
  }
}
