import { CronJob } from 'cron'
import debug from 'debug'
import { CouchbaseModel } from '../../db/model'
import { createDependenciesContainer, createLegacyDependenciesContainer } from '../../infrastructure/dependencies'
import { utc } from '../../lib/date'
import { moveWorksheetOutOfFreezer } from '../../business/worksheets/freezer'
import { SystemPreferencesRepository } from '../../system-preferences/models'
import { cronJobs } from '../../../config'

const cronDebug = debug('app:cron:worksheets:freezer')
const timeZone = 'UTC'
const cronTime = cronJobs.freezer

async function onTick () {
  const pref = await SystemPreferencesRepository.getPreferences()
  if (pref.freezer.enable) {
    cronDebug(`Executing freezer cron at ${utc().startOf('minute').toISOString()}`)
    const dependencies = createDependenciesContainer(
      await CouchbaseModel.prototype._promiseBucket, {},
      createLegacyDependenciesContainer()
    )

    await moveWorksheetOutOfFreezer(false, 500, dependencies.buildingRepository)
  } else {
    cronDebug(`Freeze cron called at ${utc().startOf('minute').toISOString()} but do nothing is disabled`)
  }
}

export default new CronJob({
  start: false,
  cronTime,
  timeZone,
  onTick
})
