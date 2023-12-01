import { startListeners } from '../../src/infrastructure/listeners'
import { EventBus } from '../../src/infrastructure/event-bus'
import { expect } from 'chai'
import { createDiContainer, setupContainer } from '../../src/infrastructure/dependencies'
import { Logger } from 'winston'
import { createContainer } from 'awilix'

describe('startListeners', () => {
  let container
  beforeEach(() => {
    container = createContainer()
    setupContainer(container, null, null)
  })

  it('start all listeners without errors', () => {
    const logger: Logger = container.resolve('logger')
    logger.silent = true

    expect(() => startListeners(container)).to.not.throw
  })
})
