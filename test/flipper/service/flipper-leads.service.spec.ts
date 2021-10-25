import { FlipperLeadsService, LeadsForCommand } from '../../../src/flipper/service/flipper-leads.service'
import { pipe } from 'fp-ts/function'
import { orFail } from '../../helpers'

describe('FlipperLeadsService', () => {
  let service: FlipperLeadsService
  const testCmd: LeadsForCommand = {
    flipperId: 'test-flipper-id',
  }

  beforeEach(() => {
    service = new FlipperLeadsService()
  })

  it('returns scheduled calls by others as leads', () => {
    return pipe(
      service.leadsFor(testCmd),
      orFail()
    )
  })
})
