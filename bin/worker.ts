import { initLogger } from '../src/infrastructure/logger'
import { connectCouchbaseBucket } from '../src/db/connect-couchbase-bucket'
import { createDiContainer } from '../src/infrastructure/dependencies'
import { EventPoller } from '../src/infrastructure/event-bus/event-poller'

const logger = initLogger()
logger.info('starting worker')

init().catch(error => {
  logger.crit('Error initializing worker', { stack: error.stack, ...error })
  process.exit(1)
})

async function init () {
  const eventPoller = await getEventPoller()
  while (true) {
    try {
      const outcome = await eventPoller.poll()
      if (outcome === 'no-event-received') {
        logger.info('no event received, waiting before continue polling')
        await sleepEmptyMessageWaitTime()
      }
    } catch (error) {
      logger.error('Error processing event or polling', { stack: error.stack, ...error })
    }
  }
}

function getEventPoller (): Promise<EventPoller> {
  return connectCouchbaseBucket()
    .then(createDiContainer)
    .then(container => container.resolve('eventPoller'))
}

function sleepEmptyMessageWaitTime () {
  return new Promise(resolve => {
    setTimeout(resolve, 1000)
  })
}
