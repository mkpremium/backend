import '../src/infrastructure/o11y/honeycomb'
import { initLogger } from '../src/infrastructure/logger'
import { EventPoller } from '../src/infrastructure/event-bus/event-poller'
import { Bucket } from 'couchbase'
import { startListeners } from '../src/infrastructure/listeners'
import { createContainer } from './create-container'

const logger = initLogger()
logger.info('starting worker')

init().catch(error => {
  logger.crit('Error initializing worker', { stack: error.stack, ...error })
  process.exit(1)
})

let killProcess = false
process.on('SIGTERM', () => {
  killProcess = true
})

async function init () {
  const container = await createContainer()
  const poller: EventPoller = container.resolve('eventPoller')
  const couchbaseBucket: Bucket = container.resolve('couchbaseBucket')
  await startListeners(container)

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

function sleepEmptyMessageWaitTime () {
  return new Promise(resolve => setTimeout(resolve, 1000))
}
