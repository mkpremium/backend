import { startListeners } from '../../src/infrastructure/listeners'
import { EventBus } from '../../src/infrastructure/event-bus'
import { expect } from 'chai'
import { createDiContainer } from '../../src/infrastructure/dependencies'
import { Logger } from 'winston'

describe('startListeners', () => {
  let container
  beforeEach(() => {
    container = createDiContainer(null)
  })

  it('start all listeners without errors', () => {
    const logger: Logger = container.resolve('logger')
    logger.silent = true

    startListeners(container)

    const eventBus: EventBus = container.resolve('eventBus')
    expect(Object.values(eventBus.info).reduce((acc: number, x: number) => acc + x, 0))
      .to.eql(30 + 1) // internal error listener
  })
})
