import { LeadRecorderService, RecordLeadCommand } from '../../../src/building/service/lead-recorder.service'
import { expect } from 'chai'
import { stub } from 'sinon'
import { pipe } from 'fp-ts/function'
import { map } from 'fp-ts/TaskEither'
import { orFail } from '../../helpers'
import { buildingBuilder } from '../building.builder'

describe('LeadRecorderService', () => {
  let service: LeadRecorderService
  let buildingsRepositoryStub
  const testCmd: RecordLeadCommand = {
    buildingId: 'test-building-id',
    contactId: 'test-contact-id',
    ownerId: 'test-owner-id',
    worksheetId: 'test-worksheet-id'
  }

  beforeEach(() => {
    buildingsRepositoryStub = {
      get: stub().resolves(buildingBuilder().build()),
      save: stub().resolves()
    }

    service = new LeadRecorderService(buildingsRepositoryStub)
  })

  it('saves building with lead', () => {
    return pipe(
      service.recordLead(testCmd),
      map(() => {
        expect(buildingsRepositoryStub.save).to.have.been.calledWithMatch(b => !!b.lead)
      }),
      orFail(),
    )()
  })
})
