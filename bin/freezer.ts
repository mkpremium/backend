import { initLogger } from '../src/infrastructure/logger'
import '../src/types'
import { createContainer } from './create-container'
import { FreezerService } from '../src/worksheet/service/freezer.service'

const logger = initLogger()
logger.info('starting freezer')

createContainer()
  .then(async diContainer => {
    const freezerService = diContainer.resolve('freezerService') as FreezerService
    await freezerService.moveWorksheetOutOfFreezer(parseInt(process.env.DAYS_IN_FREEZER) || 90)
    logger.info('freezer finished correctly')
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
