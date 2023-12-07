import { startListeners } from '../../src/infrastructure/listeners'
import { expect } from 'chai'
import { setupContainer } from '../../src/infrastructure/dependencies'
import { Logger } from 'winston'
import { createContainer } from 'awilix'

describe('startListeners', () => {
  [ true, false ].forEach(usePostgres => it(`start all listeners without errors (usePostgres=${usePostgres}`, () => {
    const container = createContainer()
    setupContainer(container, null, null, usePostgres)

    const logger: Logger = container.resolve('logger')
    logger.silent = true

    expect(() => startListeners(container)).to.not.throw
  }))
})
