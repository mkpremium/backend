import { startListeners } from '../../src/infrastructure/listeners'
import { expect } from 'chai'
import { setupContainer } from '../../src/infrastructure/dependencies'
import { Logger } from 'winston'
import { createContainer } from 'awilix'

describe('startListeners', () => {
  it('start all listeners without errors', () => {
    const container = createContainer()
    setupContainer(container, null)

    const logger: Logger = container.resolve('logger')
    logger.silent = true

    expect(() => startListeners(container)).to.not.throw
  })
})
