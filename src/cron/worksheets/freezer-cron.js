import { CronJob } from 'cron'
import { logger } from '../../infrastructure/logger'
import { CouchbaseModel } from '../../db/model'
import { createDependenciesContainer, createLegacyDependenciesContainer } from '../../infrastructure/dependencies'
import { moveWorksheetOutOfFreezer } from '../../business/worksheets/freezer'
import { SystemPreferencesRepository } from '../../system-preferences/models'
import { cronJobs } from '../../../config'

const timeZone = 'UTC'
const cronTime = cronJobs.freezer

async function onTick () {
  const pref = await SystemPreferencesRepository.getPreferences()
  if (pref.freezer.enable) {
    logger.info(`Executing freezer cron`)
    const dependencies = createDependenciesContainer(
      await CouchbaseModel.prototype._promiseBucket, {},
      createLegacyDependenciesContainer()
    )

    await moveWorksheetOutOfFreezer(false, 500, dependencies.buildingRepository)
  } else {
    logger.info(`Freeze called, nothing to do`)
  }
}

export default new CronJob({
  start: false,
  cronTime,
  timeZone,
  onTick
})
