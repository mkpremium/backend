import { createDiContainer } from '../../src/infrastructure/dependencies'
import { startListeners } from '../../src/infrastructure/listeners'
import { EventPublisher } from '../../src/infrastructure/event-bus'
import * as fs from 'fs'

exec()
  .then(() => {
    console.log('Done!')
    process.exit()
  })
  .catch(error => {
    console.error('Oops', { error: error.message, stack: error.stack })
    process.exit(1)
  })

async function exec () {
  const diContainer = createDiContainer(null)
  startListeners(diContainer)

  const eventBus: EventPublisher = diContainer.resolve('eventBus')
  const events = JSON.parse(fs.readFileSync(process.env.EVENTS_PATH, 'utf8'))

  for (const evt of events) {
    try {
      await eventBus.publish({
        name: 'virtual-caller.unexisting_phone_found',
        ...evt,
      })
      process.stdout.write('.')
    } catch (error) {
      console.error('Event publication failed', evt)
      throw error
    }
  }
}
