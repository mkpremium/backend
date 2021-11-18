import { startListeners } from '../../src/infrastructure/listeners'
import { EventBus } from '../../src/infrastructure/event-bus'
import { expect } from 'chai'
import { createDiContainer } from '../../src/infrastructure/dependencies'

describe('startListeners', () => {
  let container
  beforeEach(() => {
    container = createDiContainer(null)
  })

  it('start all listeners without errors', () => {
    expect(() => startListeners(container)).to.not.throw
  })

  it('adds all listeners to bus', () => {
    startListeners(container)

    const eventBus: EventBus = container.resolve('eventBus')
    expect(Object.values(eventBus.info).reduce((acc: number, x: number) => acc + x, 0)).to.eql(30)
  })
})
