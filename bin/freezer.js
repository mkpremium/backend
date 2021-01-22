import { moveWorksheetOutOfFreezer } from '../src/business/worksheets/freezer'
import { createAwilixContainer } from '../src/infrastructure/dependencies'
import { logger } from '../src/infrastructure/logger'
import { SystemPreferencesRepository } from '../src/system-preferences/models'
import '../src/types'

logger.info('starting freezer')

SystemPreferencesRepository
  .getPreferences()
  .then(async (pref) => {
    if (pref.freezer.enable) {
      logger.info(`Executing freezer cron`)
      const awilixContainer = createAwilixContainer()

      await moveWorksheetOutOfFreezer(false, 500, awilixContainer.resolve('buildingsRepository'))
    } else {
      logger.info(`Freeze called, nothing to do`)
    }
    process.exit(0)
  })
  .catch(error => {
    logger.error('starting freezer', {
      error: {
        message: error.message ? error.message : error.toString(),
        stack: error.stack ? error.stack : undefined
      }
    })
    process.exit(1)
  })
