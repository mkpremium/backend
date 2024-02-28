import { stub } from 'sinon'
import { resolveDependencies } from '../../helpers'
import { expect } from 'chai'
import { SqsBus } from '../../../src/infrastructure/event-bus/sqs-bus'
import type { SQS } from 'aws-sdk'
import { DomainEvent, DomainEventCatalog } from '../../../src/infrastructure/postgres/domain-event.entity'
import type { EntityManager } from 'typeorm'

describe('SqsBus publish method (Integration)', () => {
  it('should store the event when publish is called', async () => {
    const { container } = await resolveDependencies()
    const sqsClientStub = {
      sendMessageBatch: stub().returns({ promise: () => Promise.resolve({ Successful: [], Failed: [] }) })
    }

    const eventsQueueUrl: any = container.resolve('eventsQueueUrl')
    const entityManager = container.resolve('entityManager') as EntityManager
    const sqsBus = new SqsBus(
      container.resolve('logger'),
      sqsClientStub as any as SQS,
      eventsQueueUrl,
      container.resolve('listenersRegistry'),
      container.resolve('eventNamingPolicy'),
      entityManager
    )

    const event = {
      name: DomainEventCatalog.BUILDING__BUILDING_IMPORTED,
      buildingId: 'testbuildingId'
    }

    sqsBus.on(DomainEventCatalog.BUILDING__BUILDING_IMPORTED, 'test.listener', () => undefined)
    await sqsBus.publish(event)

    const sendMessagesArg = sqsClientStub.sendMessageBatch.lastCall.firstArg
    expect(sendMessagesArg.QueueUrl).to.be.equal(eventsQueueUrl)

    expect(await entityManager.findOneBy(DomainEvent, { name: DomainEventCatalog.BUILDING__BUILDING_IMPORTED })).to.be.ok
  })
})
