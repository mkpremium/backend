import { expect } from 'chai'
import { ComposedBus } from '../../src/infrastructure/event-bus/composed-bus'

describe('ComposedBus', () => {
  let service: ComposedBus
  let sqsEventBusStub
  let eventEmitterBusStub

  beforeEach(() => {
    service = new ComposedBus(
      sqsEventBusStub,
      eventEmitterBusStub,
    )
  })

  it('is not implemented', () => {
    expect(true).to.be.false
  })
})
