import { initLogger } from '../src/infrastructure/logger'
import { connectCouchbaseBucket } from '../src/db/connect-couchbase-bucket'
import { createDiContainer } from '../src/infrastructure/dependencies'
import { EventPoller } from '../src/infrastructure/event-bus/event-poller'
import { Bucket } from 'couchbase'

const logger = initLogger()
logger.info('starting worker')

init().catch(error => {
  logger.crit('Error initializing worker', { stack: error.stack, ...error })
  process.exit(1)
})

let killProcess = false
process.on('SIGTERM', () => killProcess = true)

async function init () {
  const { poller, couchbaseBucket } = await getDependencies()
  while (true) {
    if (killProcess) {
      logger.info('SIGTERM received, stopping process')
      couchbaseBucket.disconnect()
      process.exit()
      return
    }

    try {
      const outcome = await poller.poll()
      if (outcome === 'no-event-received') {
        logger.info('no event received, waiting before continue polling')
        await sleepEmptyMessageWaitTime()
      }
    } catch (error) {
      logger.error('Error processing event or polling', { stack: error.stack, ...error })
    }
  }
}

function getDependencies (): Promise<{ poller: EventPoller, couchbaseBucket: Bucket }> {
  return connectCouchbaseBucket()
    .then(createDiContainer)
    .then(container => ({
      poller: container.resolve('eventPoller'),
      couchbaseBucket: container.resolve('couchbaseBucket'),
    }))
}

function sleepEmptyMessageWaitTime () {
  return new Promise(resolve => setTimeout(resolve, 1000))
}
