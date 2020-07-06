import '../src/types'
import { logger } from '../src/infrastructure/logger'
import worksheetFreezerCron from '../src/cron/worksheets/freezer-cron'

logger.info('starting cron jobs')

worksheetFreezerCron.start()
