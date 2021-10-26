import { FlipperLeadsService, LeadsForCommand } from '../../../src/flipper/service/flipper-leads.service'
import { pipe } from 'fp-ts/function'
import { orFail } from '../../helpers'
import { map } from 'fp-ts/TaskEither'
import { expect } from 'chai'
import { stub } from 'sinon'
import { buildingBuilder } from '../../building/building.builder'
import * as TE from 'fp-ts/TaskEither'

describe('FlipperLeadsService', () => {
  let service: FlipperLeadsService
  let scheduledCallsServiceStub
  let buildingsReadRepositoryStub

  const testCmd: LeadsForCommand = {
    flipperId: 'test-flipper-id',
  }

  beforeEach(() => {
    scheduledCallsServiceStub = {
      scheduledCallsFor: stub(),
    }
    buildingsReadRepositoryStub = {
      assignedToFlipperAndWithStatus: stub(),
    }

    service = new FlipperLeadsService(buildingsReadRepositoryStub)
  })

  it('returns buildings with LEAD negotiation status', () => {
    scheduledCallsServiceStub.scheduledCallsFor.resolves([])
    buildingsReadRepositoryStub.assignedToFlipperAndWithStatus.withArgs(testCmd.flipperId, 'LEAD')
      .returns(TE.of([buildingBuilder({
      lead: {
        worksheetId: 'test-lead-worksheet-id',
        ownerId: 'test-lead-owner-id',
        contactId: 'test-lead-contact-id',
        capturedAt: new Date(),
      }
    }).build()]))

    return pipe(
      service.leadsFor(testCmd),
      map(leads => {
        expect(leads).to.have.lengthOf(1)
      }),
      orFail()
    )()
  })
})
