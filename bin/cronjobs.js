import '../src/types'
import debug from 'debug'
import worksheetFreezerCron from '../src/cron/worksheets/freezer-cron'

const cronDebug = debug('app:cron')

cronDebug('bootstraping cronjobs')

worksheetFreezerCron.start()
