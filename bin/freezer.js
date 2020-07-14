import { moveWorksheetOutOfFreezer } from '../src/business/worksheets/freezer'
import { CouchbaseModel } from '../src/db/model'
import { createDependenciesContainer, createLegacyDependenciesContainer } from '../src/infrastructure/dependencies'
import { logger } from '../src/infrastructure/logger'
import { SystemPreferencesRepository } from '../src/system-preferences/models'
import '../src/types'

logger.info('starting freezer')

SystemPreferencesRepository
  .getPreferences()
  .then(async (pref) => {
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
  })
  .catch(error => {
    logger.error('starting freezer', { error })
  })
