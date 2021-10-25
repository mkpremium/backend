import { FlipperLeadsService, LeadsForCommand } from '../../../src/flipper/service/flipper-leads.service'
import { pipe } from 'fp-ts/function'
import { orFail } from '../../helpers'
import { map } from 'fp-ts/TaskEither'
import { expect } from 'chai'
import { stub } from 'sinon'
import { buildingBuilder } from '../../building/building.builder'

describe('FlipperLeadsService', () => {
  let service: FlipperLeadsService
  let scheduledCallsServiceStub

  const testCmd: LeadsForCommand = {
    flipperId: 'test-flipper-id',
  }

  beforeEach(() => {
    scheduledCallsServiceStub = {
      scheduledCallsFor: stub(),
    }

    service = new FlipperLeadsService(scheduledCallsServiceStub)
  })

  it('returns scheduled calls by others as leads', () => {
    scheduledCallsServiceStub.scheduledCallsFor.resolves([
      { id: 'scheduled-call', createdBy: testCmd.flipperId },
      {
        id: 'lead', createdBy: 'someone-else', event: {
          owner: {
            building: buildingBuilder().build(),
            person: {
              name: 'test person'
            }
          }
        }
      },
    ])

    return pipe(
      service.leadsFor(testCmd),
      map(leads => {
        expect(leads).to.have.lengthOf(1)
      }),
      orFail()
    )()
  })
})
