import { LeadRecorderService, RecordLeadCommand } from '../../../src/building/service/lead-recorder.service'
import { expect } from 'chai'
import sinon, { stub } from 'sinon'
import { pipe } from 'fp-ts/function'
import { map } from 'fp-ts/TaskEither'
import { orFail } from '../../helpers'
import { buildingBuilder } from '../building.builder'
import { DomainEventCatalog } from '../../../src/infrastructure/postgres/domain-event.entity'

describe('LeadRecorderService', () => {
  let service: LeadRecorderService
  let buildingsRepositoryStub
  let eventBusStub
  const testCmd: RecordLeadCommand = {
    buildingId: 'test-building-id',
    contactId: 'test-contact-id',
    ownerId: 'test-owner-id',
    worksheetId: 'test-worksheet-id',
    toFlipperId: 'test-flipper-id'
  }

  beforeEach(() => {
    buildingsRepositoryStub = {
      get: stub().resolves(buildingBuilder().build()),
      save: stub().resolves()
    }
    eventBusStub = {
      publish: stub().resolves()
    }

    service = new LeadRecorderService(buildingsRepositoryStub, eventBusStub)
  })

  it('saves building with lead', () => {
    return pipe(
      service.recordLead(testCmd),
      map(() => {
        expect(buildingsRepositoryStub.save).to.have.been.calledWithMatch(b => !!b.lead)
      }),
      orFail()
    )()
  })

  it('publishes event', () => {
    return pipe(
      service.recordLead(testCmd),
      map(() => {
        expect(eventBusStub.publish).to.have.been.calledWith(sinon.match({
          name: DomainEventCatalog.BUILDING__LEAD_CAPTURED,
          buildingId: testCmd.buildingId,
          ownerId: testCmd.ownerId,
          contactId: testCmd.contactId
        }))
      }),
      orFail()
    )()
  })

  it('does not record lead for building with existing lead', () => {
    buildingsRepositoryStub.get.resolves(buildingBuilder({
      lead: { capturedAt: new Date(), contactId: '', ownerId: '', worksheetId: '' }
    }).build())

    return pipe(
      service.recordLead(testCmd),
      map(() => {
        expect(buildingsRepositoryStub.save).to.not.have.been.called
      }),
      orFail()
    )()
  })
})
