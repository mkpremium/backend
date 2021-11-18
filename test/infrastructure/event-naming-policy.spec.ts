import { eventNamingPolicy } from '../../src/infrastructure/event-bus/event-naming-policy'
import { expect } from 'chai'

describe('EventNamingPolicy', () => {
  it('checks that source contains module prefix', () => [
    expect(eventNamingPolicy.satisfiesEventName('.event_name')).to.be.false
  ])

  it('checks that source finish with event name', () => [
    expect(eventNamingPolicy.satisfiesEventName('source_module.')).to.be.false
  ])

  it('accept correctly formatted names', () => [
    expect(eventNamingPolicy.satisfiesEventName('source_module.event_name')).to.be.true
  ])
})
